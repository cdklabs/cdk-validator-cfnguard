import { App, Stack, StackProps, aws_s3 as s3 } from 'aws-cdk-lib';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Construct } from 'constructs';
import { CfnGuardValidator } from '../src';

const app = new App({
  policyValidationBeta1: [new CfnGuardValidator()],
});


class MyConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    new s3.Bucket(this as any, 'Bucket', {
      blockPublicAccess: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
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
