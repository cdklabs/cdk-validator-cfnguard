import * as fs from 'fs';
import * as path from 'path';
import * as plugin from '../src/plugin';
import * as utils from '../src/utils';


let execMock: jest.SpyInstance;
let guardResult1: any;
beforeEach(() => {
  execMock = jest.spyOn(utils, 'exec').mockReturnValue({
    not_compliant: [],
  });
  const json = fs.readFileSync(path.join(__dirname, 'test-data/guard-result1.json')).toString('utf8').trim();
  guardResult1 = JSON.parse(json);
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

  test('test1', () => {
    execMock.mockReturnValue(guardResult1);
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
});

