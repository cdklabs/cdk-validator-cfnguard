import { spawnSync } from 'child_process';
import * as path from 'path';
import {
  IValidationPlugin,
  ValidationContext,
  ValidationViolatingResource,
  ValidationReport,
  ValidationViolationResourceAware,
  ValidationViolation,
} from 'aws-cdk-lib';
import { exec } from './utils';

/**
 * The status
 */
enum RuleStatus {
  FAIL = 'FAIL',
  PASS = 'PASS',
}

/**
 * The result returned by running the cfn-guard
 * CLI
 *
 * Guard does not have a standard JSON schema and the schema
 * that is returned can be dependent on the type of rule or type
 * of check that was executed. The results are very much an attempt to
 * display the internals of guard to the user. Trying to make sense of that
 * can be difficult and error prone.
 *
 * The result structure can depend on the way that the rule was written. For example
 * I could write a rule like this:
 *
 *     rule MY_RULE {
 *       # This is a "check" and is a `Clause` type check
 *       Properties.SomeProp == true
 *     }
 *
 * Or I could write a rule like this:
 *
 *     rule MY_RULE {
 *       #  This is a "check" and is a `Rule` type check
 *       check(Properties)
 *     }
 *     rule check(properties) {
 *       properties.SomeProp == true
 *     }
 *
 * Both of the above examples are checking the same thing
 * but the schema that is returned is different because the
 * way the rule was written is different
 */
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

  /**
   * A list of rule results for rules that are not compliant
   *
   * @default - will be empty if there are no non-compliant rules
   */
  readonly not_compliant?: { Rule: NonCompliantRule }[];

  /**
   * A list of rules that were run, but were not applicable to the
   * template. For example, if the template did not contain any SNS Topics
   * then any rules that applied to SNS topics would appear in this list
   *
   * @default - will be empty if all rules were applicable
   */
  readonly not_applicable?: string[];

  /**
   * A list of rules that were applicable to the template and
   * passed validation.
   *
   * @default - will be empty if no rules are compliant
   */
  readonly compliant?: string[];
}

/**
 * Information returned for a rule that is not compliant
 */
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

  /**
   * List of checks that were run as part of the rule
   * and their associated result
   */
  readonly checks: (RuleChecks | ClauseChecks)[];
}

/**
 * A check that is a `Rule` type
 */
type RuleChecks = { Rule: RuleCheck };

/**
 * A check that is a `Clause` type
 */
type ClauseChecks = { Clause: { [key: string]: ClauseCheck } };

/**
 * A `Rule` type check that has unresolved checks
 */
type UnresolvedRuleChecks = { [key: string]: UnresolvedRuleCheck };

/**
 * Messages for a given rule
 */
interface RuleMessages {
  /**
   * A custom message that can be returned by a rule.
   * This would be a message that is defined within a
   * rule by the rule author and is usually user friendly,
   * but arbitrarily formatted.
   *
   * @default - undefined (no custom message)
   */
  readonly custom_message?: string;

  /**
   * A guard generated message. This will always
   * be available, but is generally not a user friendly
   * message
   */
  readonly error_message: string;
}


/**
 * A check result for the `Rule` type check
 */
interface RuleCheck {
  /**
   * The name of the `Rule` check
   */
  readonly name: string;

  /**
   * TODO: this is always empty, can it be populated?
   */
  readonly metadata?: any;

  /**
   * Messages for the rule check. These messages
   * can apply to all clause checks within the rule check
   */
  readonly messages: RuleMessages;

  /**
   * A list of checks that were run as part of the rule check
   */
  readonly checks: (ClauseChecks | UnresolvedRuleChecks)[];
}

interface CheckCommon {
  /**
   * This usually contains information on what part of the
   * Guard rule caused the failure. For example
   *  '%s3_buckets_default_lock_enabled[*].Properties.ObjectLockEnabled EXISTS'
   */
  readonly context: string;

  /**
   * Messages returned by the check
   */
  readonly messages: RuleMessages;

}

/**
 * An unresolved clause check that is part of a
 * `Rule` type check. This is only different from
 * the `ClauseCheck.check.Unresolved` because the schema
 * is slightly different. It doesn't need to be (it's the same information)
 * it's just the way cfn-guard chose to render the result
 */
interface UnresolvedRuleCheck extends CheckCommon {
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
  readonly unresolved: UnresolvedCheckValue;
}

/**
 * The results of a `Clause` type check
 */
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
    UnResolved?: UnresolvedCheck;

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

/**
 * In an Unresolved check, this is how
 * far the check was able to traverse to.
 */
interface Traversed {
  /**
   * The JSON path that the rule was able to traverse
   * to. For example, `/Resources/MyCustomResource`
   */
  readonly path: string;

  /**
   * The value at the traversed to path
   */
  readonly value: any;
}

/**
 * In a resolved check, the final traversed to property
 */
interface ResolvedTraversedTo {
  /**
   * This is always undefined
   */
  readonly path?: string;

  /**
   * The expected value at this path
   */
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

/**
 * An unresolved `Clause` check
 */
interface UnresolvedCheck {
  /**
   * Information on the unresolved check
   */
  readonly value: UnresolvedCheckValue;

  /**
   * The comparison that the check made
   * For example ["Exists", false]
   */
  readonly comparison: string[];
};

/**
 * A resolved `Clause` check
 */
interface ResolvedCheck {
  /**
   * Information on the "actual" property
   */
  readonly from: Traversed;

  /**
   * Information on the "expected" property
   */
  readonly to: ResolvedTraversedTo;

  /**
   * The comparison that the check made
   * For example ["Exists", false]
   */
  readonly comparison: string[];
};

/**
 * A validation plugin using CFN Guard
 */
export class CfnGuardValidator implements IValidationPlugin {
  public readonly name: string;
  private readonly rulesPath: string;
  /**
   * List of violations in the report.
   */
  private readonly violations: ValidationViolationResourceAware[] = [];
  private success?: boolean;

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
    try {
      const result: GuardResult = exec(['cfn-guard', ...flags], {
        json: true,
      });
      if (!result.not_compliant || result.not_compliant.length === 0) {
        return { pluginName: this.name, success: true, violations: [] };
      }
      this.success = false;
      result.not_compliant.forEach((check) => {
        const violationCheck = new ViolationCheck(check.Rule, '');
        const violation = violationCheck.processCheck();
        this.violations.push(...violation);
      });
    } catch (e) {
      this.success = false;
      console.error(e);
    }
    return {
      pluginName: this.name,
      success: this.success,
      violations: this.violations,
    };
  }
}

type violationResourceMap = {
  resource: Map<string, Pick<ValidationViolatingResource, 'locations'>>;
  violation: Pick<ValidationViolation, 'recommendation' | 'fix'>;
};

class ViolationCheck {
  private readonly violatingResources = new Map<string, violationResourceMap>();
  private readonly violation: { fix?: string; recommendation?: string } = {};
  constructor(
    private readonly ruleCheck: NonCompliantRule,
    private readonly templatePath: string,
  ) { }

  private setViolatingResources(check: ClauseCheck | UnresolvedRuleCheck): void {
    this.violation.recommendation = this.violation.recommendation || check.messages.custom_message || check.messages.error_message;
    this.violation.fix = this.violation.fix ?? check.messages.custom_message ?? '';
    let location: string;
    if (check.hasOwnProperty('check')) {
      const clauseCheck = check as ClauseCheck;
      location = clauseCheck.check.Resolved?.from.path
        ?? clauseCheck.check.UnResolved!.value.traversed_to.path;
    } else {
      const unresolvedCheck = check as UnresolvedRuleCheck;
      location = unresolvedCheck.unresolved.traversed_to.path;
    }
    const resourceName = location.split('/')[2];
    const violatingResource = this.violatingResources.get(this.violation.fix);
    const result = {
      locations: [location],
    };
    if (violatingResource) {
      const resource = violatingResource.resource.get(resourceName);
      if (resource) {
        resource.locations.push(location);
      } else {
        violatingResource.resource.set(resourceName, result);
      }
    } else {
      this.violatingResources.set(this.violation.fix, {
        resource: new Map([[resourceName, result]]),
        violation: {
          recommendation: this.violation.recommendation ?? '',
          fix: this.violation.fix,
        },
      });
    }
  }

  public processCheck(): ValidationViolationResourceAware[] {
    this.ruleCheck.checks.forEach(check => {
      if (check.hasOwnProperty('Rule')) {
        const checkRule = check as RuleChecks;
        const rule = checkRule.Rule;
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
        recommendation: violation.violation.recommendation,
        fix: violation.violation.fix,
        ruleName: this.ruleCheck.name,
        violatingResources: Array.from(violation.resource.entries()).map(([key, value]) => {
          return {
            locations: value.locations,
            resourceName: key,
            templatePath: this.templatePath,
          };
        }),
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
