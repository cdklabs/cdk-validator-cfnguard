import { spawnSync } from 'child_process';
import * as path from 'path';
import {
  IValidationPlugin,
  ValidationContext,
  ValidationReportStatus,
  ValidationViolatingResource,
  ValidationReport,
  ValidationViolationResourceAware,
  ValidationViolation,
} from 'aws-cdk-lib';
import { exec } from './utils';

enum RuleStatus {
  FAIL = 'FAIL',
  PASS = 'PASS',
}

interface GuardResult {
  /**
   * TODO: figure out what this is
   * it's always an empty string
   */
  readonly name?: string;
  /**
   * TODO: figure out what can be in here
   * it's always empty when I run it
   */
  readonly metadata?: any;

  /**
   * The overall status of the rule, pass or fail
   */
  readonly status: RuleStatus;
  readonly not_compliant?: { Rule: NonCompliantRule }[];

  /**
   * A list of rules that were run, but were not applicable to the
   * template. For example, if the template did not contain any SNS Topics
   * then any rules that applied to SNS topics would appear in this list
   */
  readonly not_applicable?: string[];

  /**
   * A list of rules that were applicable to the template and
   * passed validation.
   */
  readonly compliant?: string[];
}

interface NonCompliantRule {
  /**
   * The name of the Guard rule
   */
  readonly name: string;

  /**
   * TODO: figure out what can be in here
   * it's always empty when I run it
   */
  readonly metadata?: any;
  /**
   * TODO: this is always empty, how do rules populate this?
   */
  readonly messages?: RuleMessages;
  readonly checks: (RuleChecks | ClauseChecks)[];
}

type RuleChecks = { Rule: RuleCheck };
type ClauseChecks = { Clause: { [key: string]: ClauseCheck } };
type UnresolvedRuleChecks = { [key: string]: UnresolvedRuleCheck };

interface RuleMessages {
  readonly custom_message?: string;
  readonly error_message: string;
}


interface RuleCheck {
  readonly name: string;
  readonly metadata?: any;
  readonly messages: RuleMessages;
  readonly checks: (ClauseChecks | UnresolvedRuleChecks)[];
}

interface CheckCommon {
  /**
   * This usually contains information on what part of the
   * Guard rule caused the failure. For example
   *  '%s3_buckets_default_lock_enabled[*].Properties.ObjectLockEnabled EXISTS'
   */
  readonly context: string;
  readonly messages: RuleMessages;

}

interface UnresolvedRuleCheck extends CheckCommon {
  readonly unresolved: UnresolvedCheckValue;
}

interface ClauseCheck extends CheckCommon {
  /**
   * A check can either be 'Resolved' or 'Unresolved'
   */
  readonly check: {
    /**
     * The check was "Unresolved" meaning the check was not able
     * to completely evaluate the rule. For example if the object in
     * question looks like
     * { Properties: { SomeNestedProperty: { Key: 'Value' } } }
     *
     * And the rule is trying to evaluate that `Properties.SomeNestedProperty.Key==='Value'`
     * it will be "Unresolved" if the template does not contain `SomeNestedProperty`.
     * The rule will fail because it knows that if `SomeNestedProperty` doesn't exist
     * then obviously the `Key !== 'Value'`
     */
    Unresolved?: UnresolvedCheck;

    /**
     * The check that failed was able to completely resolve all properties.
     * For example if the object in question looks like
     * { Properties: { SomeNestedProperty: { Key: 'Value' } } }
     *
     * Then the user provided something like
     * { Properties: { SomeNestedProperty: { Key: 'SomeOtherValue' } } }
     *
     * The rule was able to resolve the entire object it needed to evaluate.
     */
    Resolved?: ResolvedCheck;
  };
};

interface Traversed {
  readonly path: string;
  readonly value: any;
}

interface TraversedMissing {
  readonly path?: string;
  readonly value: any;
}

interface UnresolvedCheckValue {
  /**
   * At some point the rule ran into a missing property.
   * How far was the rule able to traverse the object.
   */
  readonly traversed_to: Traversed;

  /**
   * What is the remaining property path that it wasn't able to traverse to
   * For example, given and expected object of
   * { Properties: { Nested: true } }
   * And an actual object of
   * { Properties : {} }
   *
   * The remaining_query would be `Nested`
   */
  readonly remaining_query: string;

  /**
   * The reason that the rule was unable to traverse. For example
   * Could not find key ObjectLockEnabled inside struct at path /Resources/MyCustomL3ConstructBucket8C61BCA7/Properties[L:4,C:17]
   */
  readonly reason: string;
}

interface UnresolvedCheck {
  readonly value: UnresolvedCheckValue;
  readonly comparison: string[];
};

interface ResolvedCheck {
  readonly from: Traversed;
  readonly to: TraversedMissing;
  readonly comparison: string[];
};

export class CfnGuardValidator implements IValidationPlugin {
  public readonly name: string;
  private readonly rulesPath: string;
  /**
   * List of violations in the report.
   */
  private readonly violations: ValidationViolationResourceAware[] = [];

  constructor() {
    this.name = 'cdk-validator-cfnguard';
    this.rulesPath = path.join(__dirname, '../rules');
  }

  isReady(): boolean {
    const { status } = spawnSync('cfn-guard', ['--version'], {
      encoding: 'utf-8',
      stdio: 'pipe',
      env: { ...process.env },
    });
    return status === 0;
  }

  validate(context: ValidationContext): ValidationReport {
    const templatePaths = context.templatePaths;
    const flags = [
      'validate',
      '--rules',
      this.rulesPath,
      ...templatePaths.flatMap(template => ['--data', template]),
      '--output-format',
      'json',
      '--show-summary',
      'none',
    ];
    let status = ValidationReportStatus.FAILURE;
    try {
      const result: GuardResult = exec(['cfn-guard', ...flags], {
        json: true,
      });
      if (!result) throw new Error('result is empty!!!');
      if (!result.not_compliant || result.not_compliant.length === 0) {
        status = ValidationReportStatus.SUCCESS;
        return { pluginName: this.name, success: true, violations: [] };
      }
      status = ValidationReportStatus.FAILURE;
      result.not_compliant.forEach((check) => {
        const violationCheck = new ViolationCheck(check.Rule, '');
        const violation = violationCheck.processCheck();
        this.violations.push(...violation);
      });
    } catch (e) {
      status = ValidationReportStatus.FAILURE;
      console.error(e);
    } finally {
      return {
        pluginName: this.name,
        success: status === ValidationReportStatus.SUCCESS,
        violations: this.violations,
      };
    }
  }
}

class ViolationCheck {
  private readonly violatingResources = new Map<string, ValidationViolatingResource & Pick<ValidationViolation, 'recommendation' | 'fix'>>();
  private readonly violation: { fix?: string; recommendation?: string } = {};
  constructor(
    private readonly ruleCheck: NonCompliantRule,
    private readonly templatePath: string,
  ) { }

  private setViolatingResources(check: ClauseCheck | UnresolvedRuleCheck): void {
    this.violation.fix = this.violation.fix ?? check.messages.custom_message ?? check.messages.error_message;
    let location: string;
    if (check.hasOwnProperty('check')) {
      const clauseCheck = check as ClauseCheck;
      location = clauseCheck.check.Resolved?.from.path ?? clauseCheck.check.Unresolved!.value.traversed_to.path;
    } else {
      const unresolvedCheck = check as UnresolvedRuleCheck;
      location = unresolvedCheck.unresolved.traversed_to.path;
    }
    const res = this.violatingResources.get(this.violation.fix);
    if (res) {
      res.locations.push(location);
    } else {
      this.violatingResources.set(this.violation.fix, {
        recommendation: this.violation.recommendation ?? '', // TODO: figure out what this should be
        fix: this.violation.fix,
        locations: [location],
        resourceName: location.split('/')[2],
        templatePath: this.templatePath,
      });
    }
  }

  public processCheck(): ValidationViolationResourceAware[] {
    this.ruleCheck.checks.forEach(check => {
      if (check.hasOwnProperty('Rule')) {
        const checkRule = check as RuleChecks;
        const rule = checkRule.Rule;
        // then it is of type NonCompliantRule
        if (rule.messages?.custom_message) {
          const message = rule.messages.custom_message.split('\n').filter(m => m.trim() !== '');
          message.forEach(m => {
            const mes = m.trim();
            if (mes.startsWith('[FIX]')) {
              this.violation.fix = mes;
            } else {
              this.violation.recommendation = mes;
            }
          });
          this.processClause(rule.checks);
        }
      } else {
        const clauseChecks = check as ClauseChecks;
        this.processClause([clauseChecks]);
      }
    });
    return Array.from(this.violatingResources.values()).map(violation => {
      return {
        recommendation: violation.recommendation,
        fix: violation.fix,
        ruleName: this.ruleCheck.name,
        violatingResources: [{
          locations: violation.locations,
          resourceName: violation.resourceName,
          templatePath: violation.templatePath,
        }],
      };
    });
  }

  private processClause(clauses: (ClauseChecks | UnresolvedRuleChecks)[]): void {
    clauses.forEach(clause => {
      if (clause.hasOwnProperty('Clause')) {
        const clauseChecks = clause as ClauseChecks;
        Object.values(clauseChecks.Clause).forEach(v => {
          this.setViolatingResources(v);
        });
      } else {
        const unresolvedRuleChecks = clause as UnresolvedRuleChecks;
        Object.values(unresolvedRuleChecks).map(v => {
          this.setViolatingResources(v);
        });
      }
    });
  }
}
