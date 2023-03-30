import { App, Stack, StackProps, aws_s3 as s3 } from 'aws-cdk-lib';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Construct } from 'constructs';
import { CfnGuardValidator } from '../src';

/**
 * This is not a real integ test since we are not deploying anything
 * This can be used to manually test the plugin and view the output
 */

const app = new App({
  policyValidationBeta1: [new CfnGuardValidator()],
  context: {
    '@aws-cdk/aws-lambda:recognizeLayerVersion': 'true',
    '@aws-cdk/core:checkSecretUsage': 'true',
    '@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver': 'true',
    '@aws-cdk/aws-ec2:uniqueImdsv2TemplateName': 'true',
    '@aws-cdk/aws-ecs:arnFormatIncludesClusterName': 'true',
    '@aws-cdk/aws-iam:minimizePolicies': 'true',
    '@aws-cdk/core:validateSnapshotRemovalPolicy': 'true',
    '@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName': 'true',
    '@aws-cdk/aws-s3:createDefaultLoggingPolicy': 'true',
    '@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption': 'true',
    '@aws-cdk/aws-apigateway:disableCloudWatchRole': 'true',
    '@aws-cdk/core:enablePartitionLiterals': 'true',
    '@aws-cdk/aws-events:eventsTargetQueueSameAccount': 'true',
    '@aws-cdk/aws-iam:standardizedServicePrincipals': 'true',
    '@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker': 'true',
    '@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName': 'true',
    '@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy': 'true',
  },
});


class MyConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    new s3.Bucket(this as any, 'Bucket', {
      // blockPublicAccess: {
      //   blockPublicAcls: true,
      //   blockPublicPolicy: true,
      //   ignorePublicAcls: true,
      //   restrictPublicBuckets: true,
      // },
    });
  }
}

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope as any, id, props);
    new MyConstruct(this as any, 'MyConstruct');
  }
}

new MyStack(app as any, 'MyStack');
