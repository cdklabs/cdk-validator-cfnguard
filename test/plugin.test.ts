import * as fs from 'fs';
import * as path from 'path';
import * as plugin from '../src/plugin';
import { RuleSet } from '../src/types.gen';
import * as utils from '../src/utils';


let execMock: jest.SpyInstance;
function getData(fileName: string): any {
  const json = fs.readFileSync(path.join(__dirname, 'test-data', fileName)).toString('utf8').trim();
  return JSON.parse(json);
}
let validator: plugin.CfnGuardValidator;
beforeEach(() => {
  validator = new plugin.CfnGuardValidator({
    managedRuleSets: [
      RuleSet.CIS_AWS_BENCHMARK_LEVEL_1(),
    ],
    disabledRules: [
      'iam_no_inline_policy_check',
      'iam_policy_no_statements_with_admin_access',
      's3_bucket_versioning_enabled',
      's3_bucket_level_public_access_prohibited',
      'encrypted_volumes',
      'ec2_ebs_encryption_by_default',
      'rds_snapshot_encrypted',
      'rds_storage_encrypted',
      's3_bucket_public_read_prohibited',
      's3_bucket_public_write_prohibited',
      'cloud_trail_cloud_watch_logs_enabled',
      's3_bucket_logging_enabled',
      'restricted_ssh',
      'restricted_common_ports',
    ],
  });
  execMock = jest.spyOn(utils, 'exec').mockReturnValue({
    not_compliant: [],
  });
});

afterEach(() => {
  execMock.mockRestore();
});

describe('CfnGuardPlugin', () => {
  test('cfn-guard all rules used', () => {
    // GIVEN
    const val = new plugin.CfnGuardValidator();

    // WHEN
    val.validate({
      templatePaths: ['template-path-1'],
    });

    // THEN
    expect(execMock).toHaveBeenCalledTimes(83);
  });

  test('cfn-guard called', () => {
    // GIVEN
    const val = new plugin.CfnGuardValidator({
      managedRuleSets: [
        RuleSet.CIS_AWS_BENCHMARK_LEVEL_1(),
      ],
      disabledRules: [
        'iam_no_inline_policy_check',
        'iam_policy_no_statements_with_admin_access',
        's3_bucket_versioning_enabled',
        's3_bucket_level_public_access_prohibited',
        'encrypted_volumes',
        'ec2_ebs_encryption_by_default',
        'rds_snapshot_encrypted',
        'rds_storage_encrypted',
        's3_bucket_public_read_prohibited',
        's3_bucket_public_write_prohibited',
        'cloud_trail_cloud_watch_logs_enabled',
        's3_bucket_logging_enabled',
        'restricted_ssh',
        'restricted_common_ports',
      ],
    });

    // WHEN
    val.validate({
      templatePaths: ['template-path-1', 'template-path-2'],
    });

    // THEN
    expect(execMock).toHaveBeenCalledTimes(2);
    expect(execMock).toHaveBeenNthCalledWith(1, expect.arrayContaining([
      '--rules',
      path.join(__dirname, '../rules/aws-guard-rules-registry/iam/iam_user_no_policies_check.guard'),
      '--data',
      'template-path-1',
    ]), { json: true });
    expect(execMock).toHaveBeenNthCalledWith(2, expect.arrayContaining([
      '--rules',
      path.join(__dirname, '../rules/aws-guard-rules-registry/iam/iam_user_no_policies_check.guard'),
      '--data',
      'template-path-2',
      '--output-format',
      'json',
      '--show-summary',
      'none',
    ]), { json: true });
  });

  test('additional rules can be provided', () => {
    // GIVEN
    const val = new plugin.CfnGuardValidator({
      guardRulesRegistryEnabled: false,
      localRules: [
        path.join(__dirname, '../rules/aws-guard-rules-registry/iam/'),
        path.join(__dirname, '../rules/aws-guard-rules-registry/amazon_s3/s3_bucket_logging_enabled.guard'),
      ],
    });

    // WHEN
    val.validate({
      templatePaths: ['template.json'],
    });

    // THEN
    expect(execMock).toHaveBeenCalledTimes(5);
    expect(execMock).toHaveBeenNthCalledWith(1, expect.arrayContaining([
      '--rules',
      path.join(__dirname, '../rules/aws-guard-rules-registry/iam/iam_no_inline_policy_check.guard'),
      '--data',
      'template.json',
    ]), { json: true });
    expect(execMock).toHaveBeenNthCalledWith(5, expect.arrayContaining([
      '--rules',
      path.join(__dirname, '../rules/aws-guard-rules-registry/amazon_s3/s3_bucket_logging_enabled.guard'),
      '--data',
      'template.json',
    ]), { json: true });
  });

  test('guard-unresolved-rule-check', () => {
    // GIVEN
    execMock.mockReturnValue(getData('guard-unresolved-rule-check.json'));

    // WHEN
    const result = validator.validate({
      templatePaths: ['./tmp'],
    });

    // THEN
    expect(result).toEqual({
      success: false,
      violations: [{
        fix: "The parameters 'BlockPublicAcls', 'BlockPublicPolicy', 'IgnorePublicAcls', 'RestrictPublicBuckets' must be set to true under the bucket-level 'PublicAccessBlockConfiguration'.",
        description: '[CT.S3.PR.1]: Require an Amazon S3 bucket to have block public access settings configured',
        ruleMetadata: {
          DocumentationUrl: 'https://github.com/cdklabs/cdk-validator-cfnguard/blob/main/rules/aws-guard-rules-registry/iam/iam_user_no_policies_check.guard',
        },
        ruleName: 's3_bucket_level_public_access_prohibited_check',
        violatingResources: [{
          resourceLogicalId: 'MyCustomL3ConstructBucket8C61BCA7',
          templatePath: './tmp',
          locations: ['/Resources/MyCustomL3ConstructBucket8C61BCA7'],
        }],
      }],
    });
  });

  test('guard-unresolved-nested-rule-check', () => {
    // GIVEN
    execMock.mockReturnValue(getData('guard-unresolved-nested-rule-check.json'));

    // WHEN
    const result = validator.validate({
      templatePaths: ['./tmp'],
    });

    // THEN
    expect(result).toEqual({
      success: false,
      violations: [{
        fix: "The parameters 'BlockPublicAcls', 'BlockPublicPolicy', 'IgnorePublicAcls', 'RestrictPublicBuckets' must be set to true under the bucket-level 'PublicAccessBlockConfiguration'.",
        description: '[CT.S3.PR.1]: Require an Amazon S3 bucket to have block public access settings configured',
        ruleMetadata: {
          DocumentationUrl: 'https://github.com/cdklabs/cdk-validator-cfnguard/blob/main/rules/aws-guard-rules-registry/iam/iam_user_no_policies_check.guard',
        },
        ruleName: 's3_bucket_level_public_access_prohibited_check',
        violatingResources: [
          {
            resourceLogicalId: 'Bucket25524B414',
            templatePath: './tmp',
            locations: [
              '/Resources/Bucket25524B414',
            ],
          },
          {
            resourceLogicalId: 'Bucket83908E77',
            templatePath: './tmp',
            locations: [
              '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/RestrictPublicBuckets',
              '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/IgnorePublicAcls',
              '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/BlockPublicPolicy',
              '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/BlockPublicAcls',
            ],
          },
        ],
      }],
    });
  });

  test('guard-resolved-rule-check', () => {
    // GIVEN
    execMock.mockReturnValue(getData('guard-resolved-rule-check.json'));

    // WHEN
    const result = validator.validate({ templatePaths: ['./tmp'] });

    // THEN
    expect(result).toEqual({
      success: false,
      violations: [{
        fix: "The parameters 'BlockPublicAcls', 'BlockPublicPolicy', 'IgnorePublicAcls', 'RestrictPublicBuckets' must be set to true under the bucket-level 'PublicAccessBlockConfiguration'.",
        description: '[CT.S3.PR.1]: Require an Amazon S3 bucket to have block public access settings configured',
        ruleName: 's3_bucket_level_public_access_prohibited_check',
        ruleMetadata: {
          DocumentationUrl: 'https://github.com/cdklabs/cdk-validator-cfnguard/blob/main/rules/aws-guard-rules-registry/iam/iam_user_no_policies_check.guard',
        },
        violatingResources: [{
          resourceLogicalId: 'Bucket83908E77',
          templatePath: './tmp',
          locations: [
            '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/RestrictPublicBuckets',
            '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/IgnorePublicAcls',
            '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/BlockPublicPolicy',
            '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/BlockPublicAcls',
          ],
        }],
      }],
    });
  });

  test('guard-resolved-rule-check multiple resources', () => {
    // GIVEN
    execMock.mockReturnValue(getData('guard-resolved-rule-check-multiple-resources.json'));

    // WHEN
    const result = validator.validate({
      templatePaths: ['./tmp'],
    });

    // THEN
    expect(result).toEqual({
      success: false,
      violations: [{
        fix: "The parameters 'BlockPublicAcls', 'BlockPublicPolicy', 'IgnorePublicAcls', 'RestrictPublicBuckets' must be set to true under the bucket-level 'PublicAccessBlockConfiguration'.",
        description: '[CT.S3.PR.1]: Require an Amazon S3 bucket to have block public access settings configured',
        ruleName: 's3_bucket_level_public_access_prohibited_check',
        ruleMetadata: {
          DocumentationUrl: 'https://github.com/cdklabs/cdk-validator-cfnguard/blob/main/rules/aws-guard-rules-registry/iam/iam_user_no_policies_check.guard',
        },
        violatingResources: [
          {
            resourceLogicalId: 'Bucket25524B414',
            templatePath: './tmp',
            locations: [
              '/Resources/Bucket25524B414/Properties/PublicAccessBlockConfiguration/RestrictPublicBuckets',
              '/Resources/Bucket25524B414/Properties/PublicAccessBlockConfiguration/IgnorePublicAcls',
              '/Resources/Bucket25524B414/Properties/PublicAccessBlockConfiguration/BlockPublicPolicy',
              '/Resources/Bucket25524B414/Properties/PublicAccessBlockConfiguration/BlockPublicAcls',
            ],
          },
          {
            resourceLogicalId: 'Bucket83908E77',
            templatePath: './tmp',
            locations: [
              '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/RestrictPublicBuckets',
              '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/IgnorePublicAcls',
              '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/BlockPublicPolicy',
              '/Resources/Bucket83908E77/Properties/PublicAccessBlockConfiguration/BlockPublicAcls',
            ],
          },
        ],
      }],
    });
  });

  test('guard-resolved-clause-check', () => {
    // GIVEN
    execMock.mockReturnValue(getData('guard-resolved-clause-check.json'));

    // WHEN
    const result = validator.validate({
      templatePaths: ['./tmp'],
    });

    // THEN
    expect(result).toEqual({
      success: false,
      violations: [{
        description: 'S3 Bucket Public Access controls need to be restricted.',
        fix: 'Set S3 Bucket PublicAccessBlockConfiguration properties for BlockPublicAcls, BlockPublicPolicy, IgnorePublicAcls, RestrictPublicBuckets parameters to true.',
        ruleMetadata: {
          DocumentationUrl: 'https://github.com/cdklabs/cdk-validator-cfnguard/blob/main/rules/aws-guard-rules-registry/iam/iam_user_no_policies_check.guard',
        },
        ruleName: 'S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED',
        violatingResources: [
          {
            resourceLogicalId: 'MyCustomL3ConstructBucket8C61BCA7',
            templatePath: './tmp',
            locations: [
              '/Resources/MyCustomL3ConstructBucket8C61BCA7/Properties/PublicAccessBlockConfiguration/RestrictPublicBuckets',
              '/Resources/MyCustomL3ConstructBucket8C61BCA7/Properties/PublicAccessBlockConfiguration/BlockPublicAcls',
              '/Resources/MyCustomL3ConstructBucket8C61BCA7/Properties/PublicAccessBlockConfiguration/BlockPublicPolicy',
            ],
          },
        ],
      }],
    });
  });

  test('guard-unresolved-clause-check', () => {
    // GIVEN
    execMock.mockReturnValue(getData('guard-unresolved-clause-check.json'));

    // WHEN
    const result = validator.validate({
      templatePaths: ['./tmp'],
    });

    // THEN
    expect(result).toEqual({
      success: false,
      violations: [{
        description: 'S3 Bucket ObjectLockEnabled must be set to true.',
        fix: 'Set the S3 property ObjectLockEnabled parameter to true.',
        ruleName: 'S3_BUCKET_DEFAULT_LOCK_ENABLED',
        ruleMetadata: {
          DocumentationUrl: 'https://github.com/cdklabs/cdk-validator-cfnguard/blob/main/rules/aws-guard-rules-registry/iam/iam_user_no_policies_check.guard',
        },
        violatingResources: [
          {
            resourceLogicalId: 'MyCustomL3ConstructBucket8C61BCA7',
            templatePath: './tmp',
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

