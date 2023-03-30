import * as fs from 'fs';
import * as path from 'path';
import { App, Stack, aws_iam as iam } from 'aws-cdk-lib';
import { CfnGuardValidator } from '../../../../src';
import { GUARD_RULE_VALIDATION_FAILED_MESSAGE_PATTERN } from '../../../constants';

const GUARD_RULE_CHECK_NAME = 'iam_managed_policy_no_statements_with_admin_access_check';
const GUARD_RULE_PATH = path.join(__dirname, '../../../../rules/control-tower/iam/ct-iam-pr-2.guard');
const VALIDATOR_CONFIG = { rules: [GUARD_RULE_PATH], controlTowerRulesEnabled: false };

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
describe('CT.IAM.PR.2', () => {
  test('Scenario 1 validation succeeds - no resource', () => {
    // GIVEN
    const app = new App({
      policyValidationBeta1: [new CfnGuardValidator(VALIDATOR_CONFIG)],
      context: {
        '@aws-cdk/core:validationReportJson': true,
      },
    });

    // WHEN
    new Stack(app, 'Stack');

    // THEN
    expect(() => {
      app.synth();
    }).not.toThrow();

    const report = JSON.parse(fs.readFileSync(path.join(app.outdir, 'policy-validation-report.json')).toString('utf-8').trim());
    const rules = report.pluginReports.flatMap((r: any) => r.violations.flatMap((v: any) => v.ruleName));
    expect(rules).not.toContain([GUARD_RULE_CHECK_NAME]);
  });

  test('Scenario 2 validation succeeds - valid policy', () => {
    // GIVEN
    const app = new App({
      policyValidationBeta1: [new CfnGuardValidator(VALIDATOR_CONFIG)],
      context: {
        '@aws-cdk/core:validationReportJson': true,
      },
    });

    // WHEN
    const stack = new Stack(app, 'Stack');
    new iam.ManagedPolicy(stack, 'managed-policy-id', {
      description: 'Allows S3 GetObject',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['s3:GetObject'],
          resources: ['arn:aws:s3:::example-bucket'],
        }),
      ],
    });

    // THEN
    expect(() => {
      app.synth();
    }).not.toThrow();

    const report = JSON.parse(fs.readFileSync(path.join(app.outdir, 'policy-validation-report.json')).toString('utf-8').trim());
    const rules = report.pluginReports.flatMap((r: any) => r.violations.flatMap((v: any) => v.ruleName));
    expect(rules).not.toContain(GUARD_RULE_CHECK_NAME);
  });

  test('Scenario 3 validation fails - admin policy statement', () => {
    // GIVEN
    const app = new App({
      policyValidationBeta1: [new CfnGuardValidator(VALIDATOR_CONFIG)],
      context: {
        '@aws-cdk/core:validationReportJson': true,
      },
    });

    // WHEN
    const stack = new Stack(app, 'Stack');
    new iam.ManagedPolicy(stack, 'managed-policy-id', {
      description: 'Allows S3 Admin',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['*'],
          resources: ['*'],
        }),
      ],
    });

    // THEN
    expect(() => {
      app.synth();
    }).toThrow(GUARD_RULE_VALIDATION_FAILED_MESSAGE_PATTERN);

    const report = JSON.parse(fs.readFileSync(path.join(app.outdir, 'policy-validation-report.json')).toString('utf-8').trim());
    const rules = report.pluginReports.flatMap((r: any) => r.violations.flatMap((v: any) => v.ruleName));
    expect(rules).toEqual(expect.arrayContaining([GUARD_RULE_CHECK_NAME]));
  });

  test('Scenario 4 validation succeeds - deny all policy statement', () => {
    // GIVEN
    const app = new App({
      policyValidationBeta1: [new CfnGuardValidator(VALIDATOR_CONFIG)],
      context: {
        '@aws-cdk/core:validationReportJson': true,
      },
    });

    // WHEN
    const stack = new Stack(app, 'Stack');
    new iam.ManagedPolicy(stack, 'managed-policy-id', {
      description: 'Denies All',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          actions: ['*'],
          resources: ['*'],
        }),
      ],
    });

    // THEN
    expect(() => {
      app.synth();
    }).not.toThrow();

    const report = JSON.parse(fs.readFileSync(path.join(app.outdir, 'policy-validation-report.json')).toString('utf-8').trim());
    const rules = report.pluginReports.flatMap((r: any) => r.violations.flatMap((v: any) => v.ruleName));
    expect(rules).not.toContain(GUARD_RULE_CHECK_NAME);
  });
});
