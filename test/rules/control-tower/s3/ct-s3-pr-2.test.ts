import * as fs from 'fs';
import * as path from 'path';
import { join } from 'path';
import {
  App,
  Stack,
  aws_s3 as s3,
} from 'aws-cdk-lib';
//import { Key } from 'aws-cdk-lib/aws-kms';
import { CfnGuardValidator } from '../../../../src';
import { GUARD_RULE_VALIDATION_FAILED_MESSAGE_PATTERN } from '../../../constants';

const GUARD_RULE_CHECK_NAME = 's3_bucket_logging_enabled_check';
const GUARD_RULE_PATH = join(__dirname, '../../../../rules/control-tower/cfn-guard/s3/ct-s3-pr-2.guard');
const VALIDATOR_CONFIG = { rules: [GUARD_RULE_PATH], controlTowerRulesEnabled: false };

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => { });
  jest.spyOn(console, 'log').mockImplementation(() => { });
});
describe('CT.S3.PR.2', () => {
  test('Scenario 5 validation succeeds', () => {
    // GIVEN
    const app = new App({
      policyValidationBeta1: [
        new CfnGuardValidator(VALIDATOR_CONFIG),
      ],
      context: {
        '@aws-cdk/core:validationReportJson': true,
      },
    });
    //console.log(app.outdir)
    // WHEN
    const stack = new Stack(app, 'Stack');
    new s3.Bucket(stack, 'access-bucket', { serverAccessLogsBucket: s3.Bucket.fromBucketName(stack, 'loggingbucket', 'inceptionbucket') });
    //new s3.Bucket(stack, 'Bucket', { serverAccessLogsBucket: alogbucket});

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
});
