import * as fs from 'fs';
import * as path from 'path';
import * as plugin from '../src/plugin';
import * as utils from '../src/utils';


let execMock: jest.SpyInstance;
function getData(fileName: string): any {
  const json = fs.readFileSync(path.join(__dirname, 'test-data', fileName)).toString('utf8').trim();
  return JSON.parse(json);
}
beforeEach(() => {
  execMock = jest.spyOn(utils, 'exec').mockReturnValue({
    not_compliant: [],
  });
});

afterEach(() => {
  execMock.mockRestore();
});

describe('CfnGuardPlugin', () => {
  test('cfn-guard called', () => {
    // GIVEN
    const validator = new plugin.CfnGuardValidator();

    // WHEN
    validator.validate({
      templatePaths: ['./tmp'],
    });

    // THEN
    expect(execMock).toHaveBeenCalledWith([
      'cfn-guard',
      'validate',
      '--rules',
      expect.stringMatching(/cdk-validator-cfnguard\/plugin\/rules/),
      '--data',
      './tmp',
      '--output-format',
      'json',
      '--show-summary',
      'none',
    ], { json: true });
  });

  test('guard-unresolved-rule-check', () => {
    // GIVEN
    execMock.mockReturnValue(getData('guard-unresolved-rule-check.json'));
    const validator = new plugin.CfnGuardValidator();

    // WHEN
    const result = validator.validate({
      templatePaths: ['./tmp'],
    });

    // THEN
    expect(result).toEqual({
      pluginName: 'cdk-validator-cfnguard',
      success: false,
      violations: [{
        fix: "[FIX]: The parameters 'BlockPublicAcls', 'BlockPublicPolicy', 'IgnorePublicAcls', 'RestrictPublicBuckets' must be set to true under the bucket-level 'PublicAccessBlockConfiguration'.",
        recommendation: '[CT.S3.PR.1]: Require an Amazon S3 bucket to have block public access settings configured',
        ruleName: 's3_bucket_level_public_access_prohibited_check',
        violatingResources: [{
          resourceName: 'MyCustomL3ConstructBucket8C61BCA7',
          templatePath: '',
          locations: ['/Resources/MyCustomL3ConstructBucket8C61BCA7'],
        }],
      }],
    });
  });

  test('guard-resolved-rule-check', () => {
    // GIVEN
    execMock.mockReturnValue(getData('guard-resolved-rule-check.json'));
    const validator = new plugin.CfnGuardValidator();

    // WHEN
    const result = validator.validate({
      templatePaths: ['./tmp'],
    });

    // THEN
    expect(result).toEqual({
      pluginName: 'cdk-validator-cfnguard',
      success: false,
      violations: [{
        fix: "[FIX]: The parameters 'BlockPublicAcls', 'BlockPublicPolicy', 'IgnorePublicAcls', 'RestrictPublicBuckets' must be set to true under the bucket-level 'PublicAccessBlockConfiguration'.",
        recommendation: '[CT.S3.PR.1]: Require an Amazon S3 bucket to have block public access settings configured',
        ruleName: 's3_bucket_level_public_access_prohibited_check',
        violatingResources: [{
          resourceName: 'Bucket83908E77',
          templatePath: '',
          locations: [
            '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/BlockPublicAcls',
            '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/BlockPublicPolicy',
            '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/IgnorePublicAcls',
            '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/RestrictPublicBuckets',
          ],
        }],
      }],
    });
  });

  test('guard-resolved-rule-check multiple resources', () => {
    // GIVEN
    execMock.mockReturnValue(getData('guard-resolved-rule-check-multiple-resources.json'));
    const validator = new plugin.CfnGuardValidator();

    // WHEN
    const result = validator.validate({
      templatePaths: ['./tmp'],
    });

    // THEN
    expect(result).toEqual({
      pluginName: 'cdk-validator-cfnguard',
      success: false,
      violations: [{
        fix: "[FIX]: The parameters 'BlockPublicAcls', 'BlockPublicPolicy', 'IgnorePublicAcls', 'RestrictPublicBuckets' must be set to true under the bucket-level 'PublicAccessBlockConfiguration'.",
        recommendation: '[CT.S3.PR.1]: Require an Amazon S3 bucket to have block public access settings configured',
        ruleName: 's3_bucket_level_public_access_prohibited_check',
        violatingResources: [
          {
            resourceName: 'Bucket83908E77',
            templatePath: '',
            locations: [
              '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/BlockPublicAcls',
              '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/BlockPublicPolicy',
              '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/IgnorePublicAcls',
              '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/RestrictPublicBuckets',
            ],
          },
          {
            resourceName: 'Bucket25524B414',
            templatePath: '',
            locations: [
              '/Resources/Bucket25524B414/Properties/PublicAccessBlockConfiguration/BlockPublicAcls',
              '/Resources/Bucket25524B414/Properties/PublicAccessBlockConfiguration/BlockPublicPolicy',
              '/Resources/Bucket25524B414/Properties/PublicAccessBlockConfiguration/IgnorePublicAcls',
              '/Resources/Bucket25524B414/Properties/PublicAccessBlockConfiguration/RestrictPublicBuckets',
            ],
          },
        ],
      }],
    });
  });

  test('guard-resolved-clause-check', () => {
    // GIVEN
    execMock.mockReturnValue(getData('guard-resolved-clause-check.json'));
    const validator = new plugin.CfnGuardValidator();

    // WHEN
    const result = validator.validate({
      templatePaths: ['./tmp'],
    });

    // THEN
    expect(result).toEqual({
      pluginName: 'cdk-validator-cfnguard',
      success: false,
      violations: [{
        fix: '',
        recommendation: 'Check was not compliant as property value [Path=/Resources/MyCustomL3ConstructBucket8C61BCA7/Properties/PublicAccessBlockConfiguration/BlockPublicAcls[L:6,C:24] Value=false] not equal to value [Path=[L:0,C:0] Value=true].',
        ruleName: 'S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED',
        violatingResources: [
          {
            resourceName: 'MyCustomL3ConstructBucket8C61BCA7',
            templatePath: '',
            locations: [
              '/Resources/MyCustomL3ConstructBucket8C61BCA7/Properties/PublicAccessBlockConfiguration/BlockPublicAcls',
              '/Resources/MyCustomL3ConstructBucket8C61BCA7/Properties/PublicAccessBlockConfiguration/BlockPublicPolicy',
              '/Resources/MyCustomL3ConstructBucket8C61BCA7/Properties/PublicAccessBlockConfiguration/RestrictPublicBuckets',
            ],
          },
        ],
      }],
    });
  });

  test('guard-unresolved-clause-check', () => {
    // GIVEN
    execMock.mockReturnValue(getData('guard-unresolved-clause-check.json'));
    const validator = new plugin.CfnGuardValidator();

    // WHEN
    const result = validator.validate({
      templatePaths: ['./tmp'],
    });

    // THEN
    expect(result).toEqual({
      pluginName: 'cdk-validator-cfnguard',
      success: false,
      violations: [{
        fix: '',
        recommendation: 'Check was not compliant as property [Properties.ObjectLockEnabled] is missing. Value traversed to [Path=/Resources/MyCustomL3ConstructBucket8C61BCA7[L:2,C:39] Value={\"Type\":\"AWS::S3::Bucket\",\"UpdateReplacePolicy\":\"Retain\",\"DeletionPolicy\":\"Retain\",\"Metadata\":{\"aws:cdk:path\":\"CdkTestAppStack/MyCustomL3Construct/Bucket/Resource\"}}].',
        ruleName: 'S3_BUCKET_DEFAULT_LOCK_ENABLED',
        violatingResources: [
          {
            resourceName: 'MyCustomL3ConstructBucket8C61BCA7',
            templatePath: '',
            locations: [
              '/Resources/MyCustomL3ConstructBucket8C61BCA7',
              '/Resources/MyCustomL3ConstructBucket8C61BCA7',
            ],
          },
        ],
      }],
    });
  });
});

