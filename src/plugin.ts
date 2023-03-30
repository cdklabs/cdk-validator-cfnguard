import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  IPolicyValidationPluginBeta1,
  IPolicyValidationContextBeta1,
  PolicyViolationBeta1,
  PolicyValidationPluginReportBeta1,
} from 'aws-cdk-lib';
import { ViolationCheck, GuardResult } from './check';
import { exec } from './utils';

export interface CfnGuardValidatorProps {
  /**
   * Enable the default Control Tower Guard rules
   *
   * @default true
   */
  readonly controlTowerRulesEnabled?: boolean;

  /**
   * List of rule names to disable
   *
   * @default - no rules are disabled
   */
  readonly disabledRules?: string[];

  /**
   * Local file paths to either a directory containing
   * guard rules, or to an individual guard rule file
   *
   * If the path is to a directory then the directory must
   * only contain guard rule and the plugin will use
   * all the rules in the directory
   *
   * @default - no local rules will be used
   */
  readonly rules?: string[];
}

/**
 * Configuration for running guard with
 * a single rule file against a single template
 */
interface GuardExecutionConfig {
  /**
   * The path to the CloudFormation template that should
   * be validated
   */
  readonly templatePath: string;

  /**
   * The path to the guard rule file
   */
  readonly rulePath: string;
}

/**
 * A validation plugin using CFN Guard
 */
export class CfnGuardValidator implements IPolicyValidationPluginBeta1 {
  public readonly name: string;
  private readonly rulesPaths: string[] = [];
  private readonly guard: string;
  private readonly disabledRules: string[];
  private readonly executionConfig: GuardExecutionConfig[] = [];

  constructor(props: CfnGuardValidatorProps = {}) {
    this.name = 'cdk-validator-cfnguard';
    this.disabledRules = props.disabledRules ?? [];
    if (props.controlTowerRulesEnabled ?? true) {
      this.rulesPaths.push(path.join(__dirname, '..', 'rules', 'control-tower'));
    }
    this.rulesPaths.push(...props.rules ?? []);
    const osPlatform = os.platform();
    // guard calls it ubuntu but seems to apply to all linux
    // https://github.com/aws-cloudformation/cloudformation-guard/blob/184002cdfc0ae9e29c61995aae41b7d1f1d3b26c/install-guard.sh#L43-L46
    const platform = osPlatform === 'linux'
      ? 'ubuntu'
      : osPlatform === 'darwin' ? 'macos' : undefined;

    if (!platform) {
      throw new Error(`${os.platform()} not supported, must be either 'darwin' or 'linux'`);
    }
    this.guard = path.join(__dirname, '..', 'bin', platform, 'cfn-guard');
  }

  /**
   * This is (hopefully) a temporary solution to https://github.com/aws-cloudformation/cloudformation-guard/issues/180
   * Rather than try and parse the output and split out the JSON entries we'll just
   * invoke guard separately for each rule.
   */
  private generateGuardExecutionConfig(filePath: string, templatePaths: string[]): void {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      const dir = fs.readdirSync(filePath);
      dir.forEach(d => this.generateGuardExecutionConfig(path.join(filePath, d), templatePaths));
    } else {
      templatePaths.forEach(template => {
        if (!this.disabledRules.includes(path.parse(filePath).name)) {
          this.executionConfig.push({ rulePath: filePath, templatePath: template });
        }
      });
    }
  }

  validate(context: IPolicyValidationContextBeta1): PolicyValidationPluginReportBeta1 {
    const templatePaths = context.templatePaths;
    this.rulesPaths.forEach(rule => this.generateGuardExecutionConfig(rule, templatePaths));
    const result = this.executionConfig.reduce((acc, config) => {
      const report = this.execGuard(config);
      return {
        violations: [...acc.violations, ...report.violations],
        success: acc.success === false ? false : report.success,
      };
    }, { violations: [], success: true } as Pick<PolicyValidationPluginReportBeta1, 'success' | 'violations'>);
    return {
      ...result,
    };
  }

  private execGuard(config: GuardExecutionConfig): Pick<PolicyValidationPluginReportBeta1, 'success' | 'violations'> {
    const flags = [
      'validate',
      '--rules',
      config.rulePath,
      '--data',
      config.templatePath,
      '--output-format',
      'json',
      '--show-summary',
      'none',
    ];
    const violations: PolicyViolationBeta1[] = [];
    let success: boolean;
    try {
      const result = exec([this.guard, ...flags], {
        json: true,
      });
      const guardResult: GuardResult = JSON.parse(JSON.stringify(result), reviver);
      if (!guardResult.not_compliant || guardResult.not_compliant.length === 0) {
        return { success: true, violations: [] };
      }
      success = false;
      guardResult.not_compliant.forEach((check) => {
        const violationCheck = new ViolationCheck(check, config.templatePath, config.rulePath);
        const violation = violationCheck.processCheck();
        violations.push(...violation);
      });
    } catch (e) {
      success = false;
      throw new Error(`
        CfnGuardValidator plugin failed processing cfn-guard results.
        Please create an issue https://github.com/cdklabs/cdk-validator-cfnguard/issues/new
        Rule: ${path.basename(config.rulePath)}
        Error: ${e}`);
    }
    return {
      success,
      violations: violations,
    };
  }
}


/**
 * Guard does not have a standard JSON schema and the schema
 * that is returned can be dependent on the type of rule or type
 * of check that was executed. The results are very much an attempt to
 * display the internals of guard to the user. Trying to make sense of that
 * can be difficult.
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
 *
 * This reviver function is executed bottom up and is essentially
 * creating a new object with a well known schema that the rest of the
 * plugin can work with. It looks for certain fields that always appear in
 * the guard results, but appear in different locations. It finds those fields
 * and then pulls them up the object, dropping any fields that we don't
 * care about. For example guard may return
 *
 * {
 *   Clause: {
 *     Unary: {
 *       check: {
 *         UnResolved: {
 *           value: {
 *             traversed_to: {...} // we only care about this!!!
 *           }
 *         }
 *       }
 *     }
 *   }
 * }
 *
 * Or it may return
 *
 * {
 *   Rule: {
 *     checks: [{
 *       Block: {
 *         unresolved: {
 *           traversed_to: {...} // we only care about this!!!
 *         }
 *       }
 *     }]
 *   }
 * }
 *
 * In the above example we only care about the 'traversed_to' field,
 * so this reviver function will grab that field and pull it up the object, dropping
 * the fields we don't care about, ending with something like
 * {
 *   checks: [{
 *     resolved: false,
 *     traversed: {...}
 *   }]
 * }
 *
 */
function reviver(key: string, value: any): any {
  if (key === 'not_compliant') {
    // not_compliant can sometimes be an empty object (but not an Array), so we
    // process this value before diving into other object values to ensure this
    // one is always made into an Array
    return Object.values(value).map((v: any) => v.Rule);
  } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return extractNestedObject(value);
  } else if (key === 'checks' && Array.isArray(value)) {
    return extractNestedChecks(value.flatMap(v => v));
  }
  return value;
}

/**
 * Extract a nested 'checks' object. This also handles checks
 * nested within checks. It will grab the checks at the level below
 * and pull it up to the next level.
 */
function extractNestedChecks(checks: any[]): any[] {
  const containsNestedChecks = checks.some(check => Object.values(check).some((value: any) => {
    return typeof value === 'object' && value.hasOwnProperty('checks');
  }));
  if (containsNestedChecks) {
    return checks.flatMap(check => {
      if (Object.keys(check).includes('traversed')) {
        return check;
      }
      return Object.values(check).flatMap((checkValue: any) => {
        return Object.values(checkValue.checks ?? checkValue).flatMap((nestedCheckValue: any) => {
          return {
            ...nestedCheckValue,
            name: checkValue.name,
            messages: checkValue.messages ?? nestedCheckValue.messages,
          };
        });
      });
    });
  }
  return checks.flatMap(check => {
    if (Object.keys(check).includes('traversed')) {
      return check;
    }
    return Object.values(check);
  });
}

/**
 * Extract a nested object and pull it up a level
 */
function extractNestedObject(object: any): any {
  let newObject = object;
  Object.entries(object).forEach(([level1NestedKey, level1NestedValue]) => {
    const nestedValue = level1NestedValue as any;
    switch (level1NestedKey.toLowerCase()) {
      // this should always be found earlier than the rest since it appears
      // within the 'unresolved' and 'resolved' objects. The object
      // is slightly different for each case so here we create
      // a new object with the key 'traversed' with a consistent value
      case 'traversed_to':
        newObject = {
          traversed: {
            to: {
              path: nestedValue.path,
              value: nestedValue.value,
            },
            from: nestedValue.from ? {
              path: nestedValue.from.path,
              value: undefined,
            } : undefined,
          },
          messages: nestedValue.messages,
        };
        break;
      // This should be found in the "second" pass after the above
      // 'traversed_to' case has been executed. We take the new
      // object that was created in the `traversed_to` case and
      // a couple other fields, dropping the rest that we don't care about
      case 'unresolved':
        newObject = {
          resolved: false,
          traversed: nestedValue.traversed,
          messages: nestedValue.messages ?? object.messages,
        };
        break;
      // This should be found in the "second" pass after the above
      // 'traversed_to' case has been executed. We take the new
      // object that was created in the `traversed_to` case and
      // a couple other fields, dropping the rest that we don't care about
      // A check can either be resolved or unresolved
      case 'resolved':
      case 'inresolved':
        newObject = {
          resolved: true,
          traversed: {
            from: nestedValue.from,
            to: {
              path: nestedValue.from.path,
              value: nestedValue.to.value,
            },
          },
          messages: nestedValue.messages,
        };
        break;
    }
    // this check will be evaluated _after_ the 'traversed_to' check and _before_ the 'resolved'
    // and 'unresolved' checks above. There may be a case where 'traversed' is nested 2 (or 3 or 4) below
    // 'unresolved' or 'resolved' and this will keep pulling it up until it is just one below
    // and the above checks can work
    if (level1NestedValue !== null && typeof level1NestedValue === 'object' && !Array.isArray(level1NestedValue)) {
      Object.entries((level1NestedValue as object)).forEach(([level2NestedKey, level2NestedValue]) => {
        switch (level2NestedKey.toLowerCase()) {
          case 'traversed':
            newObject = {
              traversed: nestedValue.traversed,
              resolved: nestedValue.resolved,
              messages: nestedValue.messages ?? level2NestedValue.messages ?? object.messages,
            };
            break;
        }
      });
    }
  });
  return newObject;
}
