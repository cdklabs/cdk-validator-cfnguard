import * as fs from 'fs';
import * as path from 'path';
import { join } from 'path';
import {
  App,
  Stack,
  aws_s3 as s3,
  Fn,
  Aws,
} from 'aws-cdk-lib';
import { Key } from 'aws-cdk-lib/aws-kms';
import { CfnGuardValidator } from '../../../../src';
import { GUARD_RULE_VALIDATION_FAILED_MESSAGE_PATTERN } from '../../../constants';

const GUARD_RULE_CHECK_NAME = 's3_bucket_default_encryption_enabled_check';
const GUARD_RULE_PATH = join(__dirname, '../../../../rules/control-tower/cfn-guard/s3/ct-s3-pr-7.guard');
const VALIDATOR_CONFIG = { rules: [GUARD_RULE_PATH], controlTowerRulesEnabled: false };

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => { });
  jest.spyOn(console, 'log').mockImplementation(() => { });
});
describe('CT.S3.PR.7', () => {
  test('Scenario 5a validation succeeds', () => {
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
    new s3.Bucket(stack, 'Bucket', { encryption: s3.BucketEncryption.S3_MANAGED });

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

  test('Scenario 5b validation succeeds', () => {
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
    const encryptionKey = new Key(stack, 'Key');
    new s3.Bucket(stack, 'Bucket', { encryptionKey });

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

  test('Scenario 5c validation succeeds', () => {
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
    new s3.CfnBucket(stack, 'Bucket', {
      bucketEncryption:
      {
        serverSideEncryptionConfiguration:
        [{
          serverSideEncryptionByDefault:
          { sseAlgorithm: 'aws:kms' },
        },
        {
          serverSideEncryptionByDefault:
          { sseAlgorithm: 'AES256' },
        }],
      },
    });

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


  test('Scenario 2 validation fails', () => {
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
    new s3.Bucket(stack, 'Bucket');

    // THEN
    expect(() => {
      app.synth();
    }).toThrow(GUARD_RULE_VALIDATION_FAILED_MESSAGE_PATTERN);

    const report = JSON.parse(fs.readFileSync(path.join(app.outdir, 'policy-validation-report.json')).toString('utf-8').trim());
    const rules = report.pluginReports.flatMap((r: any) => r.violations.flatMap((v: any) => v.ruleName));
    expect(rules).toContain(
      GUARD_RULE_CHECK_NAME,
    );
  });

  const unsupportedSyntaxExamples = [
    Aws.NO_VALUE,
  ];

  test.each(unsupportedSyntaxExamples)('Unsupported syntax fails: %p', (configuration) => {
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
    new s3.CfnBucket(stack, 'Bucket', {
      bucketEncryption:
      {
        serverSideEncryptionConfiguration:
        [{
          serverSideEncryptionByDefault: {
            sseAlgorithm: configuration,
          },
        }],
      },
    });

    // THEN
    expect(() => {
      app.synth();
    }).toThrow(GUARD_RULE_VALIDATION_FAILED_MESSAGE_PATTERN);

    const report = JSON.parse(fs.readFileSync(path.join(app.outdir, 'policy-validation-report.json')).toString('utf-8').trim());
    console.log(report);
    const rules = report.pluginReports.flatMap((r: any) => r.violations.flatMap((v: any) => v.ruleName));
    expect(rules).toContain(
      GUARD_RULE_CHECK_NAME,
    );
  });

  const joinSyntaxExamples = [
    Fn.join(':', ['aws', 'kms']),
    Fn.join('', ['AES256']),
  ];

  test.each(joinSyntaxExamples)('Join syntax succeeds: %p', (configuration) => {
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
    new s3.CfnBucket(stack, 'Bucket', {
      bucketEncryption:
      {
        serverSideEncryptionConfiguration:
        [{
          serverSideEncryptionByDefault: {
            sseAlgorithm: configuration,
          },
        }],
      },
    });

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
