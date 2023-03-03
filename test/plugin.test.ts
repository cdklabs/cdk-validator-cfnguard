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
    const validator = new plugin.CfnGuardValidator();
    validator.validate({
      templatePaths: ['./tmp'],
    });
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
    execMock.mockReturnValue(getData('guard-unresolved-rule-check.json'));
    const validator = new plugin.CfnGuardValidator();
    const result = validator.validate({
      templatePaths: ['./tmp'],
    });
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
    execMock.mockReturnValue(getData('guard-resolved-rule-check.json'));
    const validator = new plugin.CfnGuardValidator();
    const result = validator.validate({
      templatePaths: ['./tmp'],
    });
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
    execMock.mockReturnValue(getData('guard-resolved-rule-check-multiple-resources.json'));
    const validator = new plugin.CfnGuardValidator();
    const result = validator.validate({
      templatePaths: ['./tmp'],
    });
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
});

