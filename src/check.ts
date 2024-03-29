import {
  PolicyViolationBeta1,
  PolicyViolatingResourceBeta1,
} from 'aws-cdk-lib';

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
 * This is how far the check was able to traverse to.
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
 * The result of running cfn-guard after we parse
 * the results into a well defined schema
 */
export interface GuardResult {
  /**
   * The name of the template
   */
  readonly name: string;

  /**
   * The overall status of the rule, pass or fail
   */
  readonly status: 'PASS' | 'FAIL';

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
   * TODO: this is always empty, how do rules populate this?
   *
   * @default - no rule messages
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
   * This can be slightly different depending on  whether the
   * check was resolved or not.
   */
  readonly traversed: {
    /**
     * When the check is resolved this has information
     * on the _expected_ value of the property that was checked.
     *
     * When the check is unresolved this has information on
     * The last property it was able to resolve.
     */
    to: Traversed;

    /**
     * When the check is unresolved this will be undefined.
     *
     * When the check is resolved this will contain information
     * on the _actual_ value of the property that was checked.
     */
    from?: Traversed;
  };

  /**
   * Messages for a given rule
   */
  readonly messages?: RuleMessages;
}

type violationResourceMap = {
  resource: Map<string, Pick<PolicyViolatingResourceBeta1, 'locations'>>;
  violation: Pick<PolicyViolationBeta1, 'description' | 'fix'>;
};

export class ViolationCheck {
  private readonly violatingResources = new Map<string, violationResourceMap>();
  private readonly violation: { fix?: string; description?: string } = {};
  constructor(
    private readonly ruleCheck: NonCompliantRule,
    private readonly templatePath: string,
  ) { }

  /**
   * A single guard rule can contain multiple "checks" that are run against a resource
   * or against multiple resources. So for example you might get something like:
   * {
   *   name: 's3-public-buckets-prohibited',
   *   messages: {
   *     custom_message: 'Buckets should not be public',
   *   },
   *   checks: [
   *     {
   *       traversed: {
   *         to: {
   *           path: '/Resources/MyCustomL3ConstructBucket8C61BCA7/Properties/PublicAccessBlockConfiguration/BlockPublicPolicy'
   *         }
   *       }
   *     },
   *     {
   *       traversed: {
   *         to: {
   *           path: '/Resources/MyCustomL3ConstructBucket8C61BCA7/Properties/PublicAccessBlockConfiguration/BlockPublicAcls'
   *         }
   *       }
   *     }
   *   ]
   * }
   *
   * We want to display this to the user as a single violation since there is a single
   * custom_message. This method sets up some inheritance and constructs a single violation per
   * resource+message.
   */
  private setViolatingResources(check: NonCompliantRuleCheck): void {
    // pull the description from the custom message or from the error message if available
    this.violation.description = this.violation.description || check.messages?.custom_message || check.messages?.error_message;
    // The fix will only appear in a custom_message because it would be a user
    // generated message
    this.violation.fix = this.violation.fix ?? check.messages?.custom_message ?? 'N/A';
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
          description: this.violation.description ?? '',
          fix: this.violation.fix,
        },
      });
    }
  }

  /**
   * Process a Guard result check and return a plugin violation
   * We are establishing a bit of a convention with the messages where we expect
   * the custom_message field to contain a string formatted like this
   * (based on the Control Tower rules)
   *
   *     [FIX]: Do something...
   *     [XXX]: description of the rule
   *
   * If it does contain a structure like that then we try and parse out the
   * fix and description fields, otherwise we just take the custom_message as
   * is and use it for both.
   */
  public processCheck(): PolicyViolationBeta1[] {
    this.ruleCheck.checks.forEach(check => {
      if (check.messages?.custom_message) {
        const message = check.messages.custom_message.split('\n').filter(m => m.trim() !== '');
        message.forEach(m => {
          const mes = m.trim();
          if (mes.startsWith('[FIX]')) {
            this.violation.fix = mes;
          } else {
            this.violation.description = mes;
          }
        });
      }
      this.setViolatingResources(check);
    });
    return Array.from(this.violatingResources.values()).map(violation => {
      return {
        description: violation.violation.description,
        fix: violation.violation.fix,
        ruleMetadata: {
          DocumentationUrl: this.generateRuleDocUrl(),
        },
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
  private generateRuleDocUrl(): string {
    return 'https://github.com/cdklabs/cdk-validator-cfnguard#bundled-control-tower-rules';
  }
}

