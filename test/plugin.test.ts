import * as fs from 'fs';
import * as path from 'path';
import mock from 'mock-fs';
import * as plugin from '../src/plugin';
import * as utils from '../src/utils';


let execMock: jest.SpyInstance;
function getData(fileName: string): any {
  const json = fs.readFileSync(path.join(__dirname, 'test-data', fileName)).toString('utf8').trim();
  return JSON.parse(json);
}
beforeEach(() => {
  mock({
    [path.join(__dirname, 'test-data')]: mock.load(path.join(__dirname, 'test-data')),
    [path.join(__dirname, '../rules')]: {
      'control-tower': {
        'cfn-guard': {
          amazon_s3: {
            's3-rule.guard': '',
          },
        },
      },
    },
  });
  execMock = jest.spyOn(utils, 'exec').mockReturnValue([{
    not_compliant: [],
  }]);
});

afterEach(() => {
  execMock.mockReset();
  mock.restore();
});

describe('CfnGuardPlugin', () => {
  test('cfn-guard called', () => {
    // GIVEN
    mock({
      [path.join(__dirname, '../rules')]: {
        'control-tower': {
          'cfn-guard': {
            s3: {
              'ct-s3-rule.guard': '',
            },
            efs: {
              'ct-efs-rule.guard': '',
            },
          },
        },
      },
    });
    const validator = new plugin.CfnGuardValidator();

    // WHEN
    validator.validate({
      templatePaths: ['template-path-1', 'template-path-2'],
    });

    // THEN
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    expect(validator.version).toEqual(require('../package.json').version);
    expect(validator.ruleIds).toEqual(['efsrule', 's3rule']);
    expect(execMock).toHaveBeenCalledTimes(1);
    expect(execMock).toHaveBeenNthCalledWith(1, expect.arrayContaining([
      expect.stringMatching(/.*bin\/\w+\/cfn-guard$/),
      '--rules',
      path.join(__dirname, '../rules/control-tower/cfn-guard'),
      '--data',
      'template-path-1',
      '--data',
      'template-path-2',
      '--data',
      'template-path-1',
      '--output-format',
      'json',
      '--show-summary',
      'none',
      '--structured',
    ]), { json: true });
  });

  test('only include default rules', () => {
    mock({
      [path.join(__dirname, '../test-rules')]: {
        'control-tower': {
          'cfn-guard': {
            s3: {
              'ct-s3-rule.guard': '',
            },
            efs: {
              'ct-efs-rule.guard': '',
            },
          },
        },
      },
      [path.join(__dirname, '../rules')]: {
        'control-tower': {
          'cfn-guard': {
            s3: {
              'ct-s3-pr-1.guard': '',
            },
            ecr: {
              'ct-ecr-pr-1.guard': '',
              'ct-ecr-pr-2.guard': '',
              'ct-ecr-pr-3.guard': '',
            },
          },
        },
      },
    });
    const validator = new plugin.CfnGuardValidator({
      controlTowerRulesEnabled: false,
      disabledRules: [
        'ct-s3-pr-1',
      ],
      rules: [
        path.join(__dirname, '../rules/control-tower/cfn-guard/s3/ct-s3-pr-1.guard'),
        path.join(__dirname, '../rules/control-tower/cfn-guard/ecr'),
        path.join(__dirname, '../test-rules'),
      ],
    });
    expect(validator.ruleIds).toEqual([
      'ecrpr1',
      'ecrpr2',
      'ecrpr3',
    ]);
  });

  test('rules can be disabled', () => {
    // GIVEN
    mock({
      [path.join(__dirname, '../rules')]: {
        'control-tower': {
          'cfn-guard': {
            s3: {
              'ct-s3-rule.guard': '',
            },
            efs: {
              'ct-efs-rule.guard': '',
            },
          },
        },
      },
    });
    const validator = new plugin.CfnGuardValidator({
      disabledRules: [
        'ct-s3-rule',
      ],
    });

    validator.validate({
      templatePaths: ['template.json'],
    });

    expect(execMock).toHaveBeenCalledTimes(1);
    expect(execMock).toHaveBeenCalledWith(expect.arrayContaining([
      '--rules',
      path.join(__dirname, '../rules/control-tower/cfn-guard'),
      '--data',
      'template.json',
    ]), { json: true });
  });

  test('additional rules can be provided', () => {
    // GIVEN
    mock({
      [path.join(__dirname, 'local-rules')]: {
        'directory': {
          'dir-rule.guard': '',
        },
        'file-rule.guard': '',
      },
    });
    const validator = new plugin.CfnGuardValidator({
      controlTowerRulesEnabled: false,
      rules: [
        path.join(__dirname, 'local-rules', 'directory'),
        path.join(__dirname, 'local-rules', 'file-rule.guard'),
      ],
    });

    validator.validate({
      templatePaths: ['template.json'],
    });

    expect(execMock).toHaveBeenCalledTimes(1);
    expect(execMock).toHaveBeenNthCalledWith(1, expect.arrayContaining([
      '--rules',
      path.join(__dirname, 'local-rules', 'directory'),
      '--rules',
      path.join(__dirname, 'local-rules', 'file-rule.guard'),
      '--data',
      'template.json',
    ]), { json: true });
  });

  test('guard-unresolved-rule-check', () => {
    // GIVEN
    execMock.mockReturnValue(getData('guard-unresolved-rule-check.json'));
    const validator = new plugin.CfnGuardValidator();

    // WHEN
    const result = validator.validate({
      templatePaths: ['mytemplate.json'],
    });

    // THEN
    expect(result).toEqual({
      success: false,
      violations: [{
        fix: "[FIX]: The parameters 'BlockPublicAcls', 'BlockPublicPolicy', 'IgnorePublicAcls', 'RestrictPublicBuckets' must be set to true under the bucket-level 'PublicAccessBlockConfiguration'.",
        description: '[CT.S3.PR.1]: Require an Amazon S3 bucket to have block public access settings configured',
        ruleMetadata: {
          DocumentationUrl: 'https://github.com/cdklabs/cdk-validator-cfnguard#bundled-control-tower-rules',
        },
        ruleName: 's3_bucket_level_public_access_prohibited_check',
        violatingResources: [{
          resourceLogicalId: 'MyCustomL3ConstructBucket8C61BCA7',
          templatePath: 'mytemplate.json',
          locations: ['/Resources/MyCustomL3ConstructBucket8C61BCA7'],
        }],
      }],
    });
  });

  test('guard-unresolved-nested-rule-check', () => {
    // GIVEN
    execMock.mockReturnValue(getData('guard-unresolved-nested-rule-check.json'));
    const validator = new plugin.CfnGuardValidator();

    // WHEN
    const result = validator.validate({
      templatePaths: ['mytemplate.json'],
    });

    // THEN
    expect(result).toEqual({
      success: false,
      violations: [{
        fix: "[FIX]: The parameters 'BlockPublicAcls', 'BlockPublicPolicy', 'IgnorePublicAcls', 'RestrictPublicBuckets' must be set to true under the bucket-level 'PublicAccessBlockConfiguration'.",
        description: '[CT.S3.PR.1]: Require an Amazon S3 bucket to have block public access settings configured',
        ruleName: 's3_bucket_level_public_access_prohibited_check',
        ruleMetadata: {
          DocumentationUrl: 'https://github.com/cdklabs/cdk-validator-cfnguard#bundled-control-tower-rules',
        },
        violatingResources: [
          {
            resourceLogicalId: 'Bucket83908E77',
            templatePath: 'mytemplate.json',
            locations: [
              '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/BlockPublicAcls',
              '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/BlockPublicPolicy',
              '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/IgnorePublicAcls',
              '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/RestrictPublicBuckets',
            ],
          },
          {
            resourceLogicalId: 'Bucket25524B414',
            templatePath: 'mytemplate.json',
            locations: [
              '/Resources/Bucket25524B414',
            ],
          },
        ],
      }],
    });
  });

  test('guard-resolved-rule-check', () => {
    // GIVEN
    execMock.mockReturnValue(getData('guard-resolved-rule-check.json'));
    const validator = new plugin.CfnGuardValidator();

    // WHEN
    const result = validator.validate({
      templatePaths: ['mytemplate.json'],
    });

    // THEN
    expect(result).toEqual({
      success: false,
      violations: [{
        fix: "[FIX]: The parameters 'BlockPublicAcls', 'BlockPublicPolicy', 'IgnorePublicAcls', 'RestrictPublicBuckets' must be set to true under the bucket-level 'PublicAccessBlockConfiguration'.",
        description: '[CT.S3.PR.1]: Require an Amazon S3 bucket to have block public access settings configured',
        ruleMetadata: {
          DocumentationUrl: 'https://github.com/cdklabs/cdk-validator-cfnguard#bundled-control-tower-rules',
        },
        ruleName: 's3_bucket_level_public_access_prohibited_check',
        violatingResources: [{
          resourceLogicalId: 'Bucket83908E77',
          templatePath: 'mytemplate.json',
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
      templatePaths: ['mytemplate.json'],
    });

    // THEN
    expect(result).toEqual({
      success: false,
      violations: [{
        fix: "[FIX]: The parameters 'BlockPublicAcls', 'BlockPublicPolicy', 'IgnorePublicAcls', 'RestrictPublicBuckets' must be set to true under the bucket-level 'PublicAccessBlockConfiguration'.",
        description: '[CT.S3.PR.1]: Require an Amazon S3 bucket to have block public access settings configured',
        ruleMetadata: {
          DocumentationUrl: 'https://github.com/cdklabs/cdk-validator-cfnguard#bundled-control-tower-rules',
        },
        ruleName: 's3_bucket_level_public_access_prohibited_check',
        violatingResources: [
          {
            resourceLogicalId: 'Bucket83908E77',
            templatePath: 'mytemplate.json',
            locations: [
              '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/BlockPublicAcls',
              '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/BlockPublicPolicy',
              '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/IgnorePublicAcls',
              '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/RestrictPublicBuckets',
            ],
          },
          {
            resourceLogicalId: 'Bucket25524B414',
            templatePath: 'mytemplate.json',
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
      templatePaths: ['mytemplate.json'],
    });

    // THEN
    expect(result).toEqual({
      success: false,
      violations: [{
        fix: '',
        description: 'Check was not compliant as property value [Path=/Resources/MyCustomL3ConstructBucket8C61BCA7/Properties/PublicAccessBlockConfiguration/BlockPublicAcls[L:6,C:24] Value=false] not equal to value [Path=[L:0,C:0] Value=true].',
        ruleMetadata: {
          DocumentationUrl: 'https://github.com/cdklabs/cdk-validator-cfnguard#bundled-control-tower-rules',
        },
        ruleName: 'S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED',
        violatingResources: [
          {
            resourceLogicalId: 'MyCustomL3ConstructBucket8C61BCA7',
            templatePath: 'mytemplate.json',
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
      templatePaths: ['mytemplate.json'],
    });

    // THEN
    expect(result).toEqual({
      success: false,
      violations: [{
        fix: '',
        description: 'Check was not compliant as property [Properties.ObjectLockEnabled] is missing. Value traversed to [Path=/Resources/MyCustomL3ConstructBucket8C61BCA7[L:2,C:39] Value={\"Type\":\"AWS::S3::Bucket\",\"UpdateReplacePolicy\":\"Retain\",\"DeletionPolicy\":\"Retain\",\"Metadata\":{\"aws:cdk:path\":\"CdkTestAppStack/MyCustomL3Construct/Bucket/Resource\"}}].',
        ruleMetadata: {
          DocumentationUrl: 'https://github.com/cdklabs/cdk-validator-cfnguard#bundled-control-tower-rules',
        },
        ruleName: 'S3_BUCKET_DEFAULT_LOCK_ENABLED',
        violatingResources: [
          {
            resourceLogicalId: 'MyCustomL3ConstructBucket8C61BCA7',
            templatePath: 'mytemplate.json',
            locations: [
              '/Resources/MyCustomL3ConstructBucket8C61BCA7',
              '/Resources/MyCustomL3ConstructBucket8C61BCA7',
            ],
          },
        ],
      }],
    });
  });

  test('guard-mix-checks-and-nested-checks', () => {
    // GIVEN
    execMock.mockReturnValue(getData('guard-mix-checks-and-nested-checks.json'));
    const validator = new plugin.CfnGuardValidator();

    // WHEN
    const result = validator.validate({
      templatePaths: ['mytemplate.json'],
    });

    // THEN
    expect(result).toEqual({
      success: false,
      violations: [{
        description: '[CT.CLOUDTRAIL.PR.1]: Require an AWS CloudTrail trail to have encryption at rest activated',
        ruleMetadata: {
          DocumentationUrl: 'https://github.com/cdklabs/cdk-validator-cfnguard#bundled-control-tower-rules',
        },
        fix: "[FIX]: Set the 'KMSKeyId' property to a valid KMS key.",
        ruleName: 'cloud_trail_encryption_enabled_check',
        violatingResources: [
          {
            resourceLogicalId: 'CloudTrailA62D711D',
            templatePath: 'mytemplate.json',
            locations: [
              '/Resources/CloudTrailA62D711D/Properties',
              '/Resources/CloudTrailA62D711D/Properties',
              '/Resources/CloudTrailA62D711D/Properties',
            ],
          },
        ],
      }],
    });
  });

  test('guard-disjunctions-checks', () => {
    // GIVEN
    execMock.mockReturnValue(getData('guard-disjunction-resolved-check.json'));
    const validator = new plugin.CfnGuardValidator();

    // WHEN
    const result = validator.validate({
      templatePaths: ['mytemplate.json'],
    });

    // THEN
    expect(result).toEqual({
      success: false,
      violations: [{
        description: '[CT.CLOUDFRONT.PR.6]: Require an Amazon CloudFront distribution to use custom SSL/TLS certificates',
        ruleMetadata: {
          DocumentationUrl: 'https://github.com/cdklabs/cdk-validator-cfnguard#bundled-control-tower-rules',
        },
        fix: "[FIX]: Provide a 'ViewerCertificate' configuration with values for 'AcmCertificateArn', 'MinimumProtocolVersion', and 'SslSupportMethod'.",
        ruleName: 'cloudfront_custom_ssl_certificate_check',
        violatingResources: [
          {
            resourceLogicalId: 'DistributionCFDistribution882A7313',
            templatePath: 'mytemplate.json',
            locations: [
              '/Resources/DistributionCFDistribution882A7313/Properties/DistributionConfig/ViewerCertificate/CloudFrontDefaultCertificate',
              '/Resources/DistributionCFDistribution882A7313/Properties/DistributionConfig/ViewerCertificate',
            ],
          },
        ],
      }],
    });
  });

  test('guard fails', () => {
    // GIVEN
    const validator = new plugin.CfnGuardValidator();

    // WHEN
    execMock.mockImplementationOnce(() => { throw new Error('error'); });

    // THEN
    expect(() => {
      validator.validate({
        templatePaths: ['mytemplate.json'],
      });
    }).toThrow(/CfnGuardValidator plugin failed processing/);
  });
});

