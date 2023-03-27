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
    '@aws-cdk/core:validationReportJson': true,
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
