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
    }).toThrow();
    const report = JSON.parse(fs.readFileSync(path.join(app.outdir, 'policy-validation.json')).toString('utf-8').trim());
    const rules = report.pluginReports.flatMap((r: any) => r.violations.flatMap((v: any) => v.ruleName));
    expect(rules).toEqual(expect.arrayContaining([
      'S3_BUCKET_PUBLIC_READ_PROHIBITED',
    ]));
  });
  test('synth succeeds', () => {
    // GIVEN
    const app = new App({
      policyValidationBeta1: [
        new CfnGuardValidator({
          guardRulesRegistryEnabled: false,
          localRules: [
            path.join(__dirname, '../rules/aws-guard-rules-registry/amazon_s3/s3_bucket_public_read_prohibited.guard'),
          ],
        }),
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
    expect(() => {
      app.synth();
    }).not.toThrow(/Validation failed. See the validation report above for details/);
  });
});