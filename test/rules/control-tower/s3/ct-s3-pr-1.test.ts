import * as fs from 'fs';
import * as path from 'path';
import {
  App,
  // Stage,
  Stack,
  aws_s3 as s3,
  Token,
  CfnParameter,
} from 'aws-cdk-lib';
import { CfnGuardValidator } from '../../../../src';

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => { });
  jest.spyOn(console, 'log').mockImplementation(() => { });
});
describe('CT.S3.PR.1', () => {
  test('Scenario 1 validation succeeds', () => {
    // GIVEN
    const app = new App({
      policyValidationBeta1: [
        new CfnGuardValidator(),
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
      's3_bucket_level_public_access_prohibited_check',
    ]);
  });


  test('Scenario 2 validation fails', () => {
    // GIVEN
    const app = new App({
      policyValidationBeta1: [
        new CfnGuardValidator(),
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
    }).toThrow(/^Validation failed/i);

    const report = JSON.parse(fs.readFileSync(path.join(app.outdir, 'policy-validation-report.json')).toString('utf-8').trim());
    const rules = report.pluginReports.flatMap((r: any) => r.violations.flatMap((v: any) => v.ruleName));
    expect(rules).toEqual(expect.arrayContaining([
      's3_bucket_level_public_access_prohibited_check',
    ]));
  });

  test.each([{ blockPublicAcls: true }, { blockPublicAcls: true, blockPublicPolicy: true, ignorePublicAcls: true }])('Scenario 3 validation fails: %p', (configuration) => {
    // GIVEN
    const app = new App({
      policyValidationBeta1: [
        new CfnGuardValidator(),
      ],
      context: {
        '@aws-cdk/core:validationReportJson': true,
      },
    });

    // WHEN
    const stack = new Stack(app, 'Stack');
    new s3.CfnBucket(stack, 'Bucket', { publicAccessBlockConfiguration: configuration });

    // THEN
    expect(() => {
      app.synth();
    }).toThrow(/^Validation failed/i);

    const report = JSON.parse(fs.readFileSync(path.join(app.outdir, 'policy-validation-report.json')).toString('utf-8').trim());
    const rules = report.pluginReports.flatMap((r: any) => r.violations.flatMap((v: any) => v.ruleName));
    expect(rules).toContain(
      's3_bucket_level_public_access_prohibited_check',
    );
  });

  test.each([{ blockPublicAcls: true, blockPublicPolicy: true, ignorePublicAcls: true, restrictPublicBuckets: false }])('Scenario 4 validation fails: %p', (configuration) => {
    // GIVEN
    const app = new App({
      policyValidationBeta1: [
        new CfnGuardValidator(),
      ],
      context: {
        '@aws-cdk/core:validationReportJson': true,
      },
    });

    // WHEN
    const stack = new Stack(app, 'Stack');
    new s3.CfnBucket(stack, 'Bucket', { publicAccessBlockConfiguration: configuration });

    // THEN
    expect(() => {
      app.synth();
    }).toThrow(/^Validation failed/i);

    const report = JSON.parse(fs.readFileSync(path.join(app.outdir, 'policy-validation-report.json')).toString('utf-8').trim());
    const rules = report.pluginReports.flatMap((r: any) => r.violations.flatMap((v: any) => v.ruleName));
    expect(rules).toContain(
      's3_bucket_level_public_access_prohibited_check',
    );
  });

  test('Scenario 5 validation succeeds', () => {
    // GIVEN
    const app = new App({
      policyValidationBeta1: [
        new CfnGuardValidator(),
      ],
      context: {
        '@aws-cdk/core:validationReportJson': true,
      },
    });

    // WHEN
    const stack = new Stack(app, 'Stack');
    new s3.Bucket(stack,
      'Bucket',
      {
        blockPublicAccess: {
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        },
      });

    // THEN
    expect(() => {
      app.synth();
    }).not.toThrow();

    const report = JSON.parse(fs.readFileSync(path.join(app.outdir, 'policy-validation-report.json')).toString('utf-8').trim());
    const rules = report.pluginReports.flatMap((r: any) => r.violations.flatMap((v: any) => v.ruleName));
    expect(rules).not.toContain([
      's3_bucket_level_public_access_prohibited_check',
    ]);
  });

  test('Tokenized false value fails', () => {
    // GIVEN
    const app = new App({
      policyValidationBeta1: [
        new CfnGuardValidator(),
      ],
      context: {
        '@aws-cdk/core:validationReportJson': true,
      },
    });

    // WHEN
    const stack = new Stack(app, 'Stack');
    new s3.CfnBucket(stack, 'Bucket', {
      publicAccessBlockConfiguration:
       {
         blockPublicAcls: Token.asAny(false),
         blockPublicPolicy: true,
         ignorePublicAcls: true,
         restrictPublicBuckets: true,
       },
    });

    // THEN
    expect(() => {
      app.synth();
    }).toThrow(/^Validation failed/i);

    const report = JSON.parse(fs.readFileSync(path.join(app.outdir, 'policy-validation-report.json')).toString('utf-8').trim());
    const rules = report.pluginReports.flatMap((r: any) => r.violations.flatMap((v: any) => v.ruleName));
    expect(rules).toContain(
      's3_bucket_level_public_access_prohibited_check',
    );
  });

  test('CFN stack parameter as property value fails', () => {
    // GIVEN
    const app = new App({
      policyValidationBeta1: [
        new CfnGuardValidator(),
      ],
      context: {
        '@aws-cdk/core:validationReportJson': true,
      },
    });

    // WHEN
    const stack = new Stack(app, 'Stack');
    const blockPublicAclsParameter = new CfnParameter(stack, 'BlockPublicAcls', { type: 'string', default: 'false' });
    new s3.CfnBucket(stack, 'Bucket', {
      publicAccessBlockConfiguration: {
        blockPublicAcls: blockPublicAclsParameter.value,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
    }),

    // THEN
    expect(() => {
      app.synth();
    }).toThrow(/^Validation failed/i);

    const report = JSON.parse(fs.readFileSync(path.join(app.outdir, 'policy-validation-report.json')).toString('utf-8').trim());
    const rules = report.pluginReports.flatMap((r: any) => r.violations.flatMap((v: any) => v.ruleName));
    expect(rules).toContain(
      's3_bucket_level_public_access_prohibited_check',
    );
  });
});