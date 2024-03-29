import * as fs from 'fs';
import * as path from 'path';
import {
  App,
  // Stage,
  Stack,
  aws_s3 as s3,
} from 'aws-cdk-lib';
import { CfnGuardValidator } from '../src';

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

describe('CfnGuardValidator', () => {
  test('synth fails', () => {
    // GIVEN
    const validator = new CfnGuardValidator();
    const app = new App({
      policyValidationBeta1: [
        validator,
      ],
      context: {
        '@aws-cdk/core:validationReportJson': true,
      },
    });

    // WHEN
    const stack = new Stack(app, 'Stack');
    new s3.Bucket(stack, 'Bucket');

    // THEN
    app.synth();
    expect(validator.ruleIds).toEqual(expect.arrayContaining([
      'apigatewaypr2',
      's3pr1',
    ]));
    expect(validator.ruleIds?.length).toBeGreaterThanOrEqual(133);
    expect(process.exitCode).toEqual(1);
    const report = JSON.parse(fs.readFileSync(path.join(app.outdir, 'policy-validation-report.json')).toString('utf-8').trim());
    const rules = report.pluginReports.flatMap((r: any) => r.violations.flatMap((v: any) => v.ruleName));
    expect(rules).toEqual(expect.arrayContaining([
      's3_bucket_level_public_access_prohibited_check',
    ]));
  });

  test('synth fails, debuggable', () => {
    // GIVEN
    const app = new App({
      context: {
        '@aws-cdk/core:validationReportJson': true,
      },
    });

    // WHEN
    const stack = new Stack(app, 'Stack');
    new s3.Bucket(stack, 'Bucket');

    // THEN
    const assembly = app.synth();
    const validator = new CfnGuardValidator();
    const report = validator.validate({ templatePaths: [assembly.getStackArtifact(stack.artifactId).templateFullPath] });
    expect(validator.ruleIds).toEqual(expect.arrayContaining([
      'apigatewaypr2',
      's3pr1',
    ]));
    expect(validator.ruleIds?.length).toBeGreaterThanOrEqual(133);
    const rules = report.violations.flatMap((v: any) => v.ruleName);
    expect(rules).toEqual(expect.arrayContaining([
      's3_bucket_level_public_access_prohibited_check',
    ]));
  });
  test('synth succeeds', () => {
    // GIVEN
    const validator = new CfnGuardValidator({
      controlTowerRulesEnabled: false,
      rules: [
        path.join(__dirname, '../rules/control-tower/cfn-guard/s3/ct-s3-pr-1.guard'),
      ],
    });
    const app = new App({
      policyValidationBeta1: [
        validator,
      ],
      context: {
        '@aws-cdk/core:validationReportJson': true,
      },
    });

    // WHEN
    const stack = new Stack(app, 'Stack');
    new s3.Bucket(stack, 'Bucket', {
      blockPublicAccess: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
    });

    // THEN

    expect(validator.ruleIds).toEqual(['s3pr1']);
    expect(() => {
      app.synth();
    }).not.toThrow(/Validation failed. See the validation report above for details/);
  });

  test('synth succeeds when stack is empty', () => {
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
  });
});
