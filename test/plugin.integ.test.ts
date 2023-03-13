import {
  App,
  // Stage,
  Stack,
  aws_s3 as s3,
} from 'aws-cdk-lib';
import { CfnGuardValidator } from '../src';

let consoleMock: jest.SpyInstance;

beforeEach(() => {
  consoleMock = jest.spyOn(console, 'error').mockImplementation(() => {});
});
describe('CfnGuardValidator', () => {
  test('synth fails', () => {
    // GIVEN
    const app = new App({
      validationPlugins: [
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
    const report = consoleMock.mock.calls[0][0];
    const rules = report.pluginReports.flatMap((r: any) => r.violations.flatMap((v: any) => v.ruleName));
    expect(rules).toEqual(expect.arrayContaining([
      's3_bucket_level_public_access_prohibited_check',
    ]));
  });
  test('synth succeeds', () => {
    // GIVEN
    const app = new App({
      validationPlugins: [
        new CfnGuardValidator(),
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
