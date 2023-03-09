import {
  ValidationViolatingResource,
  ValidationViolationResourceAware,
  ValidationViolation,
} from 'aws-cdk-lib';

/**
 * The status
 */
enum RuleStatus {
  FAIL = 'FAIL',
  PASS = 'PASS',
}

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

export interface GuardResult {
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
  readonly not_compliant?: NonCompliantRule[];

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
  readonly checks: NonCompliantRuleCheck[];
}

interface NonCompliantRuleCheck {
  /**
   * Whether or not this is a check that was able
   * to resolve all properties
   */
  readonly resolved: boolean;

  /**
   * Information on the properties that failed the check
   */
  readonly traversed: {
    to: Traversed;
    from?: Traversed;
  };

  /**
   * TODO: Docs
   */
  readonly messages?: RuleMessages;
}

type violationResourceMap = {
  resource: Map<string, Pick<ValidationViolatingResource, 'locations'>>;
  violation: Pick<ValidationViolation, 'description' | 'fix'>;
};

export class ViolationCheck {
  private readonly violatingResources = new Map<string, violationResourceMap>();
  private readonly violation: { fix?: string; recommendation?: string } = {};
  constructor(
    private readonly ruleCheck: NonCompliantRule,
    private readonly templatePath: string,
  ) { }

  private setViolatingResources(check: NonCompliantRuleCheck): void {
    this.violation.recommendation = this.violation.recommendation || check.messages?.custom_message || check.messages?.error_message;
    this.violation.fix = this.violation.fix ?? check.messages?.custom_message ?? '';
    const location = check.traversed.to.path;
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
          description: this.violation.recommendation ?? '',
          fix: this.violation.fix,
        },
      });
    }
  }

  public processCheck(): ValidationViolationResourceAware[] {
    this.ruleCheck.checks.forEach(check => {
      if (check.messages?.custom_message) {
        const message = check.messages.custom_message.split('\n').filter(m => m.trim() !== '');
        message.forEach(m => {
          const mes = m.trim();
          if (mes.startsWith('[FIX]')) {
            this.violation.fix = mes;
          } else {
            this.violation.recommendation = mes;
          }
        });
      }
      this.setViolatingResources(check);
    });
    return Array.from(this.violatingResources.values()).map(violation => {
      return {
        description: violation.violation.description,
        fix: violation.violation.fix,
        ruleName: this.ruleCheck.name,
        violatingResources: Array.from(violation.resource.entries()).map(([key, value]) => {
          return {
            locations: value.locations,
            resourceLogicalId: key,
            templatePath: this.templatePath,
          };
        }),
      };
    });
  }
}
