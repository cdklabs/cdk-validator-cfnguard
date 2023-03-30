import * as fs from 'fs';
import * as path from 'path';
import {
  App,
  Stack,
  aws_iam as iam,
  aws_s3 as s3,
} from 'aws-cdk-lib';
import { CfnGuardValidator } from '../../../../src';

const GUARD_RULE_CHECK_NAME = 's3_bucket_policy_ssl_requests_only_check';
const GUARD_RULE_PATH = path.join(__dirname, '../../../../rules/control-tower/s3/ct-s3-pr-8.guard');
const VALIDATOR_CONFIG = { rules: [GUARD_RULE_PATH], controlTowerRulesEnabled: false };

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => { });
  jest.spyOn(console, 'log').mockImplementation(() => { });
});
describe('CT.S3.PR.8', () => {
  test('Scenario 1 validation succeeds', () => {
    // GIVEN
    const app = new App({
      policyValidationBeta1: [
        new CfnGuardValidator(VALIDATOR_CONFIG),
      ],
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
    expect(rules).not.toContain([
      GUARD_RULE_CHECK_NAME,
    ]);
  });

  test('Scenario 2 validation fails with missing bucket object ARN', () => {
    // GIVEN
    const app = new App({
      policyValidationBeta1: [
        new CfnGuardValidator(VALIDATOR_CONFIG),
      ],
      context: {
        '@aws-cdk/core:validationReportJson': true,
      },
    });

    // WHEN
    const stack = new Stack(app, 'Stack');
    const bucket = new s3.Bucket(stack, 'Bucket', {});
    bucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.DENY,
      principals: [new iam.AnyPrincipal()],
      actions: ['*'],
      resources: [bucket.bucketArn],
      conditions: { Bool: { 'aws:SecureTransport': 'false' } },
    }));

    // THEN
    expect(() => {
      app.synth();
    }).toThrow(/Validation failed. See the validation report above for details/);

    const report = JSON.parse(fs.readFileSync(path.join(app.outdir, 'policy-validation-report.json')).toString('utf-8').trim());
    const rules = report.pluginReports.flatMap((r: any) => r.violations.flatMap((v: any) => v.ruleName));
    expect(rules).not.toContain(
      GUARD_RULE_CHECK_NAME,
    );
  });

  test('Scenario 3 validation fails on boolean within policy', () => {
    // GIVEN
    const app = new App({
      policyValidationBeta1: [
        new CfnGuardValidator(VALIDATOR_CONFIG),
      ],
      context: {
        '@aws-cdk/core:validationReportJson': true,
      },
    });

    // WHEN
    const stack = new Stack(app, 'Stack');
    const bucket = new s3.Bucket(stack, 'Bucket', {});
    bucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.DENY,
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:*'],
      resources: [bucket.bucketArn, bucket.arnForObjects('*')],
      conditions: { Bool: { 'aws:SecureTransport': false } },
    }));

    // THEN
    expect(() => {
      app.synth();
    }).toThrow(/Validation failed. See the validation report above for details/);

    const report = JSON.parse(fs.readFileSync(path.join(app.outdir, 'policy-validation-report.json')).toString('utf-8').trim());
    const rules = report.pluginReports.flatMap((r: any) => r.violations.flatMap((v: any) => v.ruleName));
    expect(rules).toEqual(expect.arrayContaining([
      GUARD_RULE_CHECK_NAME,
    ]));
  });

  test('Scenario 4 validation succeeds', () => {
    // GIVEN
    const app = new App({
      policyValidationBeta1: [
        new CfnGuardValidator(VALIDATOR_CONFIG),
      ],
      context: {
        '@aws-cdk/core:validationReportJson': true,
      },
    });

    // WHEN
    const stack = new Stack(app, 'Stack');
    const bucket = new s3.Bucket(stack, 'Bucket', {});
    bucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.DENY,
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:*'],
      resources: [bucket.bucketArn, bucket.arnForObjects('*')],
      conditions: { Bool: { 'aws:SecureTransport': 'false' } },
    }));

    // THEN
    expect(() => {
      app.synth();
    }).not.toThrow();

    const report = JSON.parse(fs.readFileSync(path.join(app.outdir, 'policy-validation-report.json')).toString('utf-8').trim());
    const rules = report.pluginReports.flatMap((r: any) => r.violations.flatMap((v: any) => v.ruleName));
    expect(rules).not.toContain(
      GUARD_RULE_CHECK_NAME,
    );
  });
});