import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  IValidationPlugin,
  IValidationContext,
  ValidationViolationResourceAware,
  ValidationPluginReport,
} from 'aws-cdk-lib';
import { ViolationCheck, GuardResult } from './check';
import { exec } from './utils';


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
export class CfnGuardValidator implements IValidationPlugin {
  public readonly name: string;
  private readonly rulesPath: string;
  private readonly guard: string;
  /**
   * List of violations in the report.
   */
  private readonly violations: ValidationViolationResourceAware[] = [];
  private success?: boolean;

  constructor() {
    this.name = 'cdk-validator-cfnguard';
    this.rulesPath = path.join(__dirname, '../rules');
    const osPlatform = os.platform();
    const platform = osPlatform === 'linux'
      ? 'ubuntu'
      : osPlatform === 'darwin' ? 'macos' : undefined;

    if (!platform) {
      throw new Error(`${os.platform()} not supported, must be either 'darwin' or 'linux'`);
    }
    this.guard = path.join(__dirname, '..', 'bin', platform, 'cfn-guard');
  }

  isReady(): boolean {
    const { status } = spawnSync(this.guard, ['--version'], {
      encoding: 'utf-8',
      stdio: 'pipe',
      env: { ...process.env },
    });
    return status === 0;
  }

  validate(context: IValidationContext): ValidationPluginReport {
    const templatePaths = context.templatePaths;

    const executionConfig: GuardExecutionConfig[] = [];
    function readPath(filePath: string) {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        const dir = fs.readdirSync(filePath);
        dir.forEach(d => readPath(path.join(filePath, d)));
      } else {
        templatePaths.forEach(template => executionConfig.push({ rulePath: filePath, templatePath: template }));
      }
    }
    readPath(this.rulesPath);
    const result = executionConfig.reduce((acc, config) => {
      const report = this.execGuard(config);
      return {
        violations: [...acc.violations, ...report.violations],
        success: acc.success === false ? false : report.success,
      };
    }, { violations: [], success: true } as Pick<ValidationPluginReport, 'success' | 'violations'>);
    return {
      pluginName: this.name,
      ...result,
    };
  }

  private execGuard(config: GuardExecutionConfig): Pick<ValidationPluginReport, 'success' | 'violations'> {
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
    try {
      const result = exec([this.guard, ...flags], {
        json: true,
      });
      const guardResult: GuardResult = JSON.parse(JSON.stringify(result), reviver);
      if (!guardResult.not_compliant || guardResult.not_compliant.length === 0) {
        return { success: true, violations: [] };
      }
      this.success = false;
      guardResult.not_compliant.forEach((check) => {
        const violationCheck = new ViolationCheck(check, '');
        const violation = violationCheck.processCheck();
        this.violations.push(...violation);
      });
    } catch (e) {
      this.success = false;
      console.error(e);
    }
    return {
      success: this.success,
      violations: this.violations,
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
 * so this reviver function will grab that field and pull it up the, dropping
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
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    let newValue = value;
    Object.entries(value).forEach(([level1NestedKey, level1NestedValue]) => {
      const nestedValue = level1NestedValue as any;
      switch (level1NestedKey.toLowerCase()) {
        case 'unresolved':
          newValue = {
            resolved: false,
            traversed: nestedValue.traversed,
            messages: nestedValue.messages ?? value.messages,
          };
          break;
        case 'resolved':
          newValue = {
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
        case 'traversed_to':
          newValue = {
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
      }
      if (level1NestedValue !== null && typeof level1NestedValue === 'object' && !Array.isArray(level1NestedValue)) {
        Object.entries(level1NestedValue).forEach(([level2NestedKey, _level2NestedValue]) => {
          switch (level2NestedKey.toLowerCase()) {
            case 'traversed':
              newValue = {
                traversed: nestedValue.traversed,
                resolved: nestedValue.resolved,
                messages: nestedValue.messages ?? _level2NestedValue.messages ?? value.messages,
              };
              break;
          }
        });
      }
    });
    return newValue;
  } else if (key === 'checks' && Array.isArray(value)) {
    if (value.some(v => Object.values(v).some((vv: any) => {
      if (typeof vv === 'object') {
        if (vv.hasOwnProperty('checks')) {
          return true;
        }
      }
      return false;
    }))) {
      return value.flatMap(v => {
        return Object.values(v).flatMap((checkValue: any) => {
          return Object.values(checkValue.checks).flatMap((vv: any) => {
            return {
              ...vv,
              name: checkValue.name,
              messages: checkValue.messages ?? vv.messages,
            };
          });
        });
      });
    }
    return value.flatMap(v => {
      if (Object.keys(v).includes('traversed')) {
        return v;
      }
      return Object.values(v);
    });
  } else if (key === 'not_compliant') {
    return Object.values(value).map((v: any) => v.Rule);
  }
  return value;
}
