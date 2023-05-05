# CDK CFN Guard Validator Plugin

<!--BEGIN STABILITY BANNER-->

---

![cdk-constructs: Experimental](https://img.shields.io/badge/cdk--constructs-experimental-important.svg?style=for-the-badge)

> The APIs of higher level constructs in this module are experimental and under active development.
> They are subject to non-backward compatible changes or removal in any future version. These are
> not subject to the [Semantic Versioning](https://semver.org/) model and breaking changes will be
> announced in the release notes. This means that while you may use them, you may need to update
> your source code when upgrading to a newer version of this package.
---

<!--END STABILITY BANNER-->


## Installing

### TypeScript/JavaScript

```bash
npm install @cdklabs/cdk-validator-cfnguard
```

### Python

```bash
pip install cdklabs.cdk-validator-cfnguard
```

### Java

```xml
// add this to your pom.xml
<dependency>
    <groupId>io.github.cdklabs</groupId>
    <artifactId>cdk-validator-cfnguard</artifactId>
    <version>0.0.0</version> // replace with version
</dependency>
```

### .NET

```bash
dotnet add package Cdklabs.CdkValidatorCfnGuard --version X.X.X
```

## Usage

To use this plugin in your CDK application add it to the CDK App.

```ts
new App({
  policyValidationBeta1: [
    new CfnGuardValidator(),
  ],
});
```

By default the `CfnGuardValidator` plugin comes with the [Control Tower
proactive
controls](https://docs.aws.amazon.com/controltower/latest/userguide/proactive-controls.html)
enabled. In order to disable these rules you can use the
`controlTowerRulesEnabled: false` property.

```ts
new CfnGuardValidator({
  controlTowerRulesEnabled: false,
});
```

It is also possible to disable individual rules.

```ts
new CfnGuardValidator({
  disabledRules: [
    'ct-s3-pr-1',
  ],
});
```

### Additional rules

To provide additional rules to the plugin, provide a list of local
file or directory paths.

```ts
new CfnGuardValidator({
  rules: [
    'path/to/local-rules-directory',
    'path/to/s3/local-rules/my-rule.guard',
  ],
});
```

If the path provided is a directory then the directory must only
contain guard rule files, and all rules within the directory will be used.

## Using the bundled Control Tower proactive controls in CDK

The bundled Control Tower proactive controls use CloudFormation Guard
policies that are also used in managed controls from the Control Tower
service. You can use these CDK bundled controls without having a Control
Tower environment in AWS, but there are many benefits to using the two together.

When you enable Control Tower proactive controls in your Control Tower environment,
the controls can stop the deployment of non-compliant resources deployed via
CloudFormation. For more information about managed proactive controls and how they work,
see the [Control Tower documentation](https://docs.aws.amazon.com/controltower/latest/userguide/proactive-controls.html).

These CDK bundled controls and managed Control Tower proactive controls are best used together.
In this scenario you can configure this validation plugin with the same proactive controls that
are active in your Control Tower cloud environment. You can then quickly gain confidence
that your CDK application will pass the Control Tower controls by running cdk synth locally
or in a pipeline as described above.

Regardless of whether you or your organization use Control Tower, however, you should
understand the following things about these bundled controls when run locally using this plugin:

1. These CloudFormation guard policies accept a limited subset of CloudFormation syntax
   for the properties they evaluate. For instance, a property called EncryptionEnabled may
   pass if it is specified with the literal value true, but it may fail if it is specified with
   a reference to a CloudFormation stack parameter instead. Similarly, if a rule checks for a string
   value, it may fail for Fn::Join objects. If you discover that a rule can be bypassed with a
   particular configuration of a resource, please file an issue.
2. Some rules may check references to other resources, but this reference checking is limited.
   For instance, a rule may require that an access logging bucket is specified for each S3 bucket.
   In this case, the rule can check whether you have passed a reference to a bucket in the same
   template, but it cannot verify that a hardcoded bucket name like "examplebucket" actually refers
   to a real bucket or a bucket you own.

You can add a layer of security protection by enabling the same proactive controls in your Control Tower
cloud environment. There are different considerations for using these controls since they operate in a
different way. For more information, see the [Control Tower proactive controls documentation](https://docs.aws.amazon.com/controltower/latest/userguide/proactive-controls.html).

If you do not yet have a Control Tower environment, see [What is AWS Control Tower?](https://docs.aws.amazon.com/controltower/latest/userguide/what-is-control-tower.html).

### Bundled Control Tower Rules

| ID                                                                                                                                                     | Name                                                                                                                                                             | Evaluated Resource Types                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [CT.ACM.PR.1](https://docs.aws.amazon.com/controltower/latest/userguide/acm-rules.html#ct-acm-pr-1-description)                                        | Require an AWS Private CA certificate to have a single domain name                                                                                               | `AWS::CertificateManager::Certificate`<br/>                                                         |
| [CT.APIGATEWAY.PR.1](https://docs.aws.amazon.com/controltower/latest/userguide/api-gateway-rules.html#ct-apigateway-pr-1-description)                  | Require an Amazon API Gateway REST and WebSocket API to have logging activated                                                                                   | `AWS::ApiGateway::Stage`<br/>                                                                       |
| [CT.APIGATEWAY.PR.2](https://docs.aws.amazon.com/controltower/latest/userguide/api-gateway-rules.html#ct-apigateway-pr-2-description)                  | Require an Amazon API Gateway REST API stage to have AWS X-Ray tracing activated                                                                                 | `AWS::ApiGateway::Stage`<br/>                                                                       |
| [CT.APIGATEWAY.PR.3](https://docs.aws.amazon.com/controltower/latest/userguide/api-gateway-rules.html#ct-apigateway-pr-3-description)                  | Require that an Amazon API Gateway REST API stage has encryption at rest configured for cache data                                                               | `AWS::ApiGateway::Stage`<br/>                                                                       |
| [CT.APIGATEWAY.PR.4](https://docs.aws.amazon.com/controltower/latest/userguide/api-gateway-rules.html#ct-apigateway-pr-4-description)                  | Require an Amazon API Gateway V2 stage to have access logging activated                                                                                          | `AWS::ApiGatewayV2::Stage`<br/>                                                                     |
| [CT.CLOUDFRONT.PR.1](https://docs.aws.amazon.com/controltower/latest/userguide/cloudfront-rules.html#ct-cloudfront-pr-1-description)                   | Require an Amazon CloudFront distribution to have a default root object configured                                                                               | `AWS::CloudFront::Distribution`<br/>                                                                |
| [CT.CLOUDFRONT.PR.2](https://docs.aws.amazon.com/controltower/latest/userguide/cloudfront-rules.html#ct-cloudfront-pr-2-description)                   | Require any Amazon CloudFront distributions with Amazon S3 backed origins to have an origin access identity configured                                           | `AWS::CloudFront::Distribution`<br/>                                                                |
| [CT.CLOUDFRONT.PR.3](https://docs.aws.amazon.com/controltower/latest/userguide/cloudfront-rules.html#ct-cloudfront-pr-3-description)                   | Require an Amazon CloudFront distribution to have encryption in transit configured                                                                               | `AWS::CloudFront::Distribution`<br/>                                                                |
| [CT.CLOUDFRONT.PR.4](https://docs.aws.amazon.com/controltower/latest/userguide/cloudfront-rules.html#ct-cloudfront-pr-4-description)                   | Require an Amazon CloudFront distribution to have origin failover configured                                                                                     | `AWS::CloudFront::Distribution`<br/>                                                                |
| [CT.CLOUDFRONT.PR.5](https://docs.aws.amazon.com/controltower/latest/userguide/cloudfront-rules.html#ct-cloudfront-pr-5-description)                   | Require any Amazon CloudFront distribution to have logging enabled                                                                                               | `AWS::CloudFront::Distribution`<br/>                                                                |
| [CT.CLOUDFRONT.PR.6](https://docs.aws.amazon.com/controltower/latest/userguide/cloudfront-rules.html#ct-cloudfront-pr-6-description)                   | Require an Amazon CloudFront distribution to use custom SSL/TLS certificates                                                                                     | `AWS::CloudFront::Distribution`<br/>                                                                |
| [CT.CLOUDFRONT.PR.7](https://docs.aws.amazon.com/controltower/latest/userguide/cloudfront-rules.html#ct-cloudfront-pr-7-description)                   | Require an Amazon CloudFront distribution to use SNI to serve HTTPS requests                                                                                     | `AWS::CloudFront::Distribution`<br/>                                                                |
| [CT.CLOUDFRONT.PR.8](https://docs.aws.amazon.com/controltower/latest/userguide/cloudfront-rules.html#ct-cloudfront-pr-8-description)                   | Require an Amazon CloudFront distribution to encrypt traffic to custom origins                                                                                   | `AWS::CloudFront::Distribution`<br/>                                                                |
| [CT.CLOUDFRONT.PR.9](https://docs.aws.amazon.com/controltower/latest/userguide/cloudfront-rules.html#ct-cloudfront-pr-9-description)                   | Require an Amazon CloudFront distribution to have a security policy of TLSv1.2 as a minimum                                                                      | `AWS::CloudFront::Distribution`<br/>                                                                |
| [CT.CLOUDFRONT.PR.10](https://docs.aws.amazon.com/controltower/latest/userguide/cloudfront-rules.html#ct-cloudfront-pr-10-description)                 | Require any Amazon CloudFront distributions with Amazon S3 backed origins to have origin access control configured                                               | `AWS::CloudFront::Distribution`<br/>                                                                |
| [CT.CLOUDFRONT.PR.11](https://docs.aws.amazon.com/controltower/latest/userguide/cloudfront-rules.html#ct-cloudfront-pr-11-description)                 | Require an Amazon CloudFront distribution to use updated SSL protocols between edge locations and custom origins                                                 | `AWS::CloudFront::Distribution`<br/>                                                                |
| [CT.CLOUDTRAIL.PR.1](https://docs.aws.amazon.com/controltower/latest/userguide/cloudtrail-rules.html#ct-cloudtrail-pr-1-description)                   | Require an AWS CloudTrail trail to have encryption at rest activated                                                                                             | `AWS::CloudTrail::Trail`<br/>                                                                       |
| [CT.CLOUDTRAIL.PR.2](https://docs.aws.amazon.com/controltower/latest/userguide/cloudtrail-rules.html#ct-cloudtrail-pr-2-description)                   | Require an AWS CloudTrail trail to have log file validation activated                                                                                            | `AWS::CloudTrail::Trail`<br/>                                                                       |
| [CT.CLOUDTRAIL.PR.3](https://docs.aws.amazon.com/controltower/latest/userguide/cloudtrail-rules.html#ct-cloudtrail-pr-3-description)                   | Require an AWS CloudTrail trail to have an Amazon CloudWatch log group configuration                                                                             | `AWS::CloudTrail::Trail`<br/>                                                                       |
| [CT.CODEBUILD.PR.1](https://docs.aws.amazon.com/controltower/latest/userguide/codebuild-rules.html#ct-codebuild-pr-1-description)                      | Require OAuth on GitHub or Bitbucket source repository URLs for AWS CodeBuild projects                                                                           | `AWS::CodeBuild::Project`<br/>                                                                      |
| [CT.CODEBUILD.PR.2](https://docs.aws.amazon.com/controltower/latest/userguide/codebuild-rules.html#ct-codebuild-pr-2-description)                      | Require any AWS CodeBuild project environment variable to encrypt credentials in environment variables                                                           | `AWS::CodeBuild::Project`<br/>                                                                      |
| [CT.CODEBUILD.PR.3](https://docs.aws.amazon.com/controltower/latest/userguide/codebuild-rules.html#ct-codebuild-pr-3-description)                      | Require any AWS CodeBuild project environment to have logging configured                                                                                         | `AWS::CodeBuild::Project`<br/>                                                                      |
| [CT.CODEBUILD.PR.4](https://docs.aws.amazon.com/controltower/latest/userguide/codebuild-rules.html#ct-codebuild-pr-4-description)                      | Require any AWS CodeBuild project to deactivate privileged mode when running                                                                                     | `AWS::CodeBuild::Project`<br/>                                                                      |
| [CT.CODEBUILD.PR.5](https://docs.aws.amazon.com/controltower/latest/userguide/codebuild-rules.html#ct-codebuild-pr-5-description)                      | Require encryption on all AWS CodeBuild project artifacts                                                                                                        | `AWS::CodeBuild::Project`<br/>                                                                      |
| [CT.CODEBUILD.PR.6](https://docs.aws.amazon.com/controltower/latest/userguide/codebuild-rules.html#ct-codebuild-pr-6-description)                      | Require encryption on all Amazon S3 logs for AWS CodeBuild projects                                                                                              | `AWS::CodeBuild::Project`<br/>                                                                      |
| [CT.DAX.PR.1](https://docs.aws.amazon.com/controltower/latest/userguide/dax-rules.html#ct-dax-pr-1-description)                                        | Require encryption at rest for all Amazon DynamoDB Accelerator (DAX) clusters                                                                                    | `AWS::DAX::Cluster`<br/>                                                                            |
| [CT.DMS.PR.1](https://docs.aws.amazon.com/controltower/latest/userguide/dms-rules.html#ct-dms-pr-1-description)                                        | Require that a public AWS DMS replication instance is not public                                                                                                 | `AWS::DMS::ReplicationInstance`<br/>                                                                |
| [CT.DYNAMODB.PR.1](https://docs.aws.amazon.com/controltower/latest/userguide/dynamodb-rules.html#ct-dynamodb-pr-1-description)                         | Require that point-in-time recovery for an Amazon DynamoDB table is activated                                                                                    | `AWS::DynamoDB::Table`<br/>                                                                         |
| [CT.EC2.PR.1](https://docs.aws.amazon.com/controltower/latest/userguide/ec2-rules.html#ct-ec2-pr-1-description)                                        | Require an Amazon EC2 launch template to have IMDSv2 configured                                                                                                  | `AWS::EC2::LaunchTemplate`<br/>                                                                     |
| [CT.EC2.PR.2](https://docs.aws.amazon.com/controltower/latest/userguide/ec2-rules.html#ct-ec2-pr-2-description)                                        | Require that Amazon EC2 launch templates restrict the token hop limit to a maximum of one                                                                        | `AWS::EC2::LaunchTemplate`<br/>                                                                     |
| [CT.EC2.PR.3](https://docs.aws.amazon.com/controltower/latest/userguide/ec2-rules.html#ct-ec2-pr-3-description)                                        | Require that any Amazon EC2 security group rule does not use the source IP range 0.0.0.0/0 or ::/0 for ports other than 80 and 443                               | `AWS::EC2::SecurityGroup`<br/>`AWS::EC2::SecurityGroupIngress`<br/>                                 |
| [CT.EC2.PR.4](https://docs.aws.amazon.com/controltower/latest/userguide/ec2-rules.html#ct-ec2-pr-4-description)                                        | Require that any Amazon EC2 security group rule does not use the source IP range 0.0.0.0/0 or ::/0 for specific high-risk ports                                  | `AWS::EC2::SecurityGroup`<br/>`AWS::EC2::SecurityGroupIngress`<br/>                                 |
| [CT.EC2.PR.5](https://docs.aws.amazon.com/controltower/latest/userguide/ec2-rules.html#ct-ec2-pr-5-description)                                        | Require any Amazon EC2 network ACL to prevent ingress from 0.0.0.0/0 to port 22 or port 3389                                                                     | `AWS::EC2::NetworkAclEntry`<br/>                                                                    |
| [CT.EC2.PR.6](https://docs.aws.amazon.com/controltower/latest/userguide/ec2-rules.html#ct-ec2-pr-6-description)                                        | Require that Amazon EC2 transit gateways refuse automatic Amazon VPC attachment requests                                                                         | `AWS::EC2::TransitGateway`<br/>                                                                     |
| [CT.EC2.PR.7](https://docs.aws.amazon.com/controltower/latest/userguide/ec2-rules.html#ct-ec2-pr-7-description)                                        | Require that an Amazon EBS volume attached to an Amazon EC2 instance is encrypted at rest                                                                        | `AWS::EC2::Instance`<br/>`AWS::EC2::Volume`<br/>                                                    |
| [CT.EC2.PR.8](https://docs.aws.amazon.com/controltower/latest/userguide/ec2-rules.html#ct-ec2-pr-8-description)                                        | Require any Amazon EC2 instance to have a non-public IP address                                                                                                  | `AWS::EC2::Instance`<br/>                                                                           |
| [CT.EC2.PR.9](https://docs.aws.amazon.com/controltower/latest/userguide/ec2-rules.html#ct-ec2-pr-9-description)                                        | Require any Amazon EC2 launch template not to auto-assign public IP addresses to network interfaces                                                              | `AWS::EC2::LaunchTemplate`<br/>                                                                     |
| [CT.EC2.PR.10](https://docs.aws.amazon.com/controltower/latest/userguide/ec2-rules.html#ct-ec2-pr-10-description)                                      | Require Amazon EC2 launch templates to have Amazon CloudWatch detailed monitoring activated                                                                      | `AWS::EC2::LaunchTemplate`<br/>                                                                     |
| [CT.EC2.PR.11](https://docs.aws.amazon.com/controltower/latest/userguide/ec2-rules.html#ct-ec2-pr-11-description)                                      | Require that an Amazon EC2 subnet does not automatically assign public IP addresses                                                                              | `AWS::EC2::Subnet`<br/>                                                                             |
| [CT.EC2.PR.12](https://docs.aws.amazon.com/controltower/latest/userguide/ec2-rules.html#ct-ec2-pr-12-description)                                      | Require an Amazon EC2 instance to configure one ENI only                                                                                                         | `AWS::EC2::Instance`<br/>                                                                           |
| [CT.ECR.PR.1](https://docs.aws.amazon.com/controltower/latest/userguide/ecr-rules.html#ct-ecr-pr-1-description)                                        | Require Amazon ECR repositories to have a lifecycle policy configured                                                                                            | `AWS::ECR::Repository`<br/>                                                                         |
| [CT.ECR.PR.2](https://docs.aws.amazon.com/controltower/latest/userguide/ecr-rules.html#ct-ecr-pr-2-description)                                        | Require Amazon ECR private repositories to have image scanning enabled                                                                                           | `AWS::ECR::Repository`<br/>                                                                         |
| [CT.ECR.PR.3](https://docs.aws.amazon.com/controltower/latest/userguide/ecr-rules.html#ct-ecr-pr-3-description)                                        | Require Amazon ECR private repositories to have tag immutability enabled                                                                                         | `AWS::ECR::Repository`<br/>                                                                         |
| [CT.ECS.PR.1](https://docs.aws.amazon.com/controltower/latest/userguide/ecs-rules.html#ct-ecs-pr-1-description)                                        | Require AWS ECS Fargate Services to run on the latest Fargate platform version                                                                                   | `AWS::ECS::Service`<br/>                                                                            |
| [CT.ECS.PR.2](https://docs.aws.amazon.com/controltower/latest/userguide/ecs-rules.html#ct-ecs-pr-2-description)                                        | Require any Amazon ECS cluster to have container insights activated                                                                                              | `AWS::ECS::Cluster`<br/>                                                                            |
| [CT.ECS.PR.3](https://docs.aws.amazon.com/controltower/latest/userguide/ecs-rules.html#ct-ecs-pr-3-description)                                        | Require any Amazon ECS task definition to specify a user that is not the root                                                                                    | `AWS::ECS::TaskDefinition`<br/>                                                                     |
| [CT.ECS.PR.4](https://docs.aws.amazon.com/controltower/latest/userguide/ecs-rules.html#ct-ecs-pr-4-description)                                        | Require Amazon ECS tasks to use 'awsvpc' networking mode                                                                                                         | `AWS::ECS::TaskDefinition`<br/>                                                                     |
| [CT.ECS.PR.5](https://docs.aws.amazon.com/controltower/latest/userguide/ecs-rules.html#ct-ecs-pr-5-description)                                        | Require an active Amazon ECS task definition to have a logging configuration                                                                                     | `AWS::ECS::TaskDefinition`<br/>                                                                     |
| [CT.ECS.PR.6](https://docs.aws.amazon.com/controltower/latest/userguide/ecs-rules.html#ct-ecs-pr-6-description)                                        | Require Amazon ECS containers to allow read-only access to the root filesystem                                                                                   | `AWS::ECS::TaskDefinition`<br/>                                                                     |
| [CT.ECS.PR.7](https://docs.aws.amazon.com/controltower/latest/userguide/ecs-rules.html#ct-ecs-pr-7-description)                                        | Require an Amazon ECS task definition to have a specific memory usage limit                                                                                      | `AWS::ECS::TaskDefinition`<br/>                                                                     |
| [CT.ECS.PR.8](https://docs.aws.amazon.com/controltower/latest/userguide/ecs-rules.html#ct-ecs-pr-8-description)                                        | Require Amazon ECS task definitions to have secure networking modes and user definitions                                                                         | `AWS::ECS::TaskDefinition`<br/>                                                                     |
| [CT.ECS.PR.9](https://docs.aws.amazon.com/controltower/latest/userguide/ecs-rules.html#ct-ecs-pr-9-description)                                        | Require Amazon ECS services not to assign public IP addresses automatically                                                                                      | `AWS::ECS::Service`<br/>                                                                            |
| [CT.ECS.PR.10](https://docs.aws.amazon.com/controltower/latest/userguide/ecs-rules.html#ct-ecs-pr-10-description)                                      | Require that Amazon ECS task definitions do not share the host's process namespace                                                                               | `AWS::ECS::TaskDefinition`<br/>                                                                     |
| [CT.ECS.PR.11](https://docs.aws.amazon.com/controltower/latest/userguide/ecs-rules.html#ct-ecs-pr-11-description)                                      | Require an Amazon ECS container to run as non-privileged                                                                                                         | `AWS::ECS::TaskDefinition`<br/>                                                                     |
| [CT.ECS.PR.12](https://docs.aws.amazon.com/controltower/latest/userguide/ecs-rules.html#ct-ecs-pr-12-description)                                      | Require that Amazon ECS task definitions do not pass secrets as container environment variables                                                                  | `AWS::ECS::TaskDefinition`<br/>                                                                     |
| [CT.ELASTICBEANSTALK.PR.1](https://docs.aws.amazon.com/controltower/latest/userguide/ebs-rules.html#ct-elasticbeanstalk-pr-1-description)              | Require AWS Elastic Beanstalk environments to have enhanced health reporting enabled                                                                             | `AWS::ElasticBeanstalk::Environment`<br/>`AWS::ElasticBeanstalk::ConfigurationTemplate`<br/>        |
| [CT.ELASTICBEANSTALK.PR.2](https://docs.aws.amazon.com/controltower/latest/userguide/ebs-rules.html#ct-elasticbeanstalk-pr-2-description)              | Require an AWS Elastic Beanstalk environment to have managed platform updates configured                                                                         | `AWS::ElasticBeanstalk::Environment`<br/>`AWS::ElasticBeanstalk::ConfigurationTemplate`<br/>        |
| [CT.ELASTICFILESYSYSTEM.PR.1](https://docs.aws.amazon.com/controltower/latest/userguide/efs-rules.html#ct-elasticfilesysystem-pr-1-description)        | Require an Amazon EFS file system to encrypt file data at rest using AWS KMS                                                                                     | `AWS::EFS::FileSystem`<br/>                                                                         |
| [CT.ELASTICFILESYSYSTEM.PR.2](https://docs.aws.amazon.com/controltower/latest/userguide/efs-rules.html#ct-elasticfilesysystem-pr-2-description)        | Require an Amazon EFS volume to have an automated backup plan                                                                                                    | `AWS::EFS::FileSystem`<br/>                                                                         |
| [CT.ELASTICFILESYSYSTEM.PR.3](https://docs.aws.amazon.com/controltower/latest/userguide/efs-rules.html#ct-elasticfilesysystem-pr-3-description)        | Require Amazon EFS access points to have a root directory                                                                                                        | `AWS::EFS::AccessPoint`<br/>                                                                        |
| [CT.ELASTICFILESYSYSTEM.PR.4](https://docs.aws.amazon.com/controltower/latest/userguide/efs-rules.html#ct-elasticfilesysystem-pr-4-description)        | Require Amazon EFS access points to enforce a user identity                                                                                                      | `AWS::EFS::AccessPoint`<br/>                                                                        |
| [CT.ELASTICLOADBALANCING.PR.1](https://docs.aws.amazon.com/controltower/latest/userguide/elb-rules.html#ct-elasticloadbalancing-pr-1-description)      | Require any application load balancer listener default actions to redirect all HTTP requests to HTTPS                                                            | `AWS::ElasticLoadBalancingV2::Listener`<br/>                                                        |
| [CT.ELASTICLOADBALANCING.PR.2](https://docs.aws.amazon.com/controltower/latest/userguide/elb-rules.html#ct-elasticloadbalancing-pr-2-description)      | Require any Amazon ELB application or network load balancer to have an AWS Certificate Manager certificate                                                       | `AWS::ElasticLoadBalancingV2::Listener`<br/>`AWS::ElasticLoadBalancingV2::ListenerCertificate`<br/> |
| [CT.ELASTICLOADBALANCING.PR.3](https://docs.aws.amazon.com/controltower/latest/userguide/elb-rules.html#ct-elasticloadbalancing-pr-3-description)      | Require any application load balancer to have defensive or strictest desync mitigation mode activated                                                            | `AWS::ElasticLoadBalancingV2::LoadBalancer`<br/>                                                    |
| [CT.ELASTICLOADBALANCING.PR.4](https://docs.aws.amazon.com/controltower/latest/userguide/elb-rules.html#ct-elasticloadbalancing-pr-4-description)      | Require that any application load balancer must be configured to drop HTTP headers                                                                               | `AWS::ElasticLoadBalancingV2::LoadBalancer`<br/>                                                    |
| [CT.ELASTICLOADBALANCING.PR.5](https://docs.aws.amazon.com/controltower/latest/userguide/elb-rules.html#ct-elasticloadbalancing-pr-5-description)      | Require that application load balancer deletion protection is activated                                                                                          | `AWS::ElasticLoadBalancingV2::LoadBalancer`<br/>                                                    |
| [CT.ELASTICLOADBALANCING.PR.6](https://docs.aws.amazon.com/controltower/latest/userguide/elb-rules.html#ct-elasticloadbalancing-pr-6-description)      | Require that application and network load balancer access logging is activated                                                                                   | `AWS::ElasticLoadBalancingV2::LoadBalancer`<br/>                                                    |
| [CT.ELASTICLOADBALANCING.PR.7](https://docs.aws.amazon.com/controltower/latest/userguide/elb-rules.html#ct-elasticloadbalancing-pr-7-description)      | Require any classic load balancer to have multiple Availability Zones configured                                                                                 | `AWS::ElasticLoadBalancing::LoadBalancer`<br/>                                                      |
| [CT.ELASTICLOADBALANCING.PR.8](https://docs.aws.amazon.com/controltower/latest/userguide/elb-rules.html#ct-elasticloadbalancing-pr-8-description)      | Require any classic load balancer SSL/HTTPS listener to have a certificate provided by AWS Certificate Manager                                                   | `AWS::ElasticLoadBalancing::LoadBalancer`<br/>                                                      |
| [CT.ELASTICLOADBALANCING.PR.9](https://docs.aws.amazon.com/controltower/latest/userguide/elb-rules.html#ct-elasticloadbalancing-pr-9-description)      | Require that an AWS ELB application or classic load balancer listener is configured with HTTPS or TLS termination                                                | `AWS::ElasticLoadBalancing::LoadBalancer`<br/>                                                      |
| [CT.ELASTICLOADBALANCING.PR.10](https://docs.aws.amazon.com/controltower/latest/userguide/elb-rules.html#ct-elasticloadbalancing-pr-10-description)    | Require an ELB application or classic load balancer to have logging activated                                                                                    | `AWS::ElasticLoadBalancing::LoadBalancer`<br/>                                                      |
| [CT.ELASTICLOADBALANCING.PR.11](https://docs.aws.amazon.com/controltower/latest/userguide/elb-rules.html#ct-elasticloadbalancing-pr-11-description)    | Require any ELB classic load balancer to have connection draining activated                                                                                      | `AWS::ElasticLoadBalancing::LoadBalancer`<br/>                                                      |
| [CT.ELASTICLOADBALANCING.PR.12](https://docs.aws.amazon.com/controltower/latest/userguide/elb-rules.html#ct-elasticloadbalancing-pr-12-description)    | Require any ELB classic load balancer SSL/HTTPS listener to have a predefined security policy with a strong configuration                                        | `AWS::ElasticLoadBalancing::LoadBalancer`<br/>                                                      |
| [CT.ELASTICLOADBALANCING.PR.13](https://docs.aws.amazon.com/controltower/latest/userguide/elb-rules.html#ct-elasticloadbalancing-pr-13-description)    | Require any ELB classic load balancer to have cross-zone load balancing activated                                                                                | `AWS::ElasticLoadBalancing::LoadBalancer`<br/>                                                      |
| [CT.GUARDDUTY.PR.1](https://docs.aws.amazon.com/controltower/latest/userguide/guard-duty-rules.html#ct-guardduty-pr-1-description)                     | Require an Amazon GuardDuty detector to have Amazon S3 protection activated                                                                                      | `AWS::GuardDuty::Detector`<br/>                                                                     |
| [CT.IAM.PR.1](https://docs.aws.amazon.com/controltower/latest/userguide/iam-rules.html#ct-iam-pr-1-description)                                        | Require that an AWS Identity and Access Management (IAM) inline policy does not have a statement that includes "*" in the Action and Resource elements           | `AWS::IAM::Policy`<br/>`AWS::IAM::Role`<br/>`AWS::IAM::User`<br/>`AWS::IAM::Group`<br/>             |
| [CT.IAM.PR.2](https://docs.aws.amazon.com/controltower/latest/userguide/iam-rules.html#ct-iam-pr-2-description)                                        | Require that AWS Identity and Access Management (IAM) customer-managed policies do not contain a statement that includes "*" in the Action and Resource elements | `AWS::IAM::ManagedPolicy`<br/>                                                                      |
| [CT.IAM.PR.3](https://docs.aws.amazon.com/controltower/latest/userguide/iam-rules.html#ct-iam-pr-3-description)                                        | Require that AWS Identity and Access Management (IAM) customer-managed policies do not have wildcard service actions                                             | `AWS::IAM::ManagedPolicy`<br/>                                                                      |
| [CT.IAM.PR.4](https://docs.aws.amazon.com/controltower/latest/userguide/iam-rules.html#ct-iam-pr-4-description)                                        | Require that an AWS Identity and Access Management (IAM) user does not have an inline or managed policy attached attached                                        | `AWS::IAM::User`<br/>`AWS::IAM::Policy`<br/>`AWS::IAM::ManagedPolicy`<br/>                          |
| [CT.IAM.PR.5](https://docs.aws.amazon.com/controltower/latest/userguide/iam-rules.html#ct-iam-pr-5-description)                                        | Require that AWS Identity and Access Management (IAM) inline policies do not have wildcard service actions                                                       | `AWS::IAM::Policy`<br/>`AWS::IAM::Role`<br/>`AWS::IAM::User`<br/>`AWS::IAM::Group`<br/>             |
| [CT.KINESIS.PR.1](https://docs.aws.amazon.com/controltower/latest/userguide/kinesis-rules.html#ct-kinesis-pr-1-description)                            | Require any Amazon Kinesis data stream to have encryption at rest configured                                                                                     | `AWS::Kinesis::Stream`<br/>                                                                         |
| [CT.KMS.PR.1](https://docs.aws.amazon.com/controltower/latest/userguide/kms-rules.html#ct-kms-pr-1-description)                                        | Require any AWS KMS key to have rotation configured                                                                                                              | `AWS::KMS::Key`<br/>                                                                                |
| [CT.LAMBDA.PR.2](https://docs.aws.amazon.com/controltower/latest/userguide/lambda-rules.html#ct-lambda-pr-2-description)                               | Require AWS Lambda function policies to prohibit public access                                                                                                   | `AWS::Lambda::Permission`<br/>                                                                      |
| [CT.NETWORK-FIREWALL.PR.1](https://docs.aws.amazon.com/controltower/latest/userguide/network-firewall-rules.html#ct-network-firewall-pr-1-description) | Require any AWS Network Firewall firewall policy to have an associated rule group                                                                                | `AWS::NetworkFirewall::FirewallPolicy`<br/>                                                         |
| [CT.NETWORK-FIREWALL.PR.2](https://docs.aws.amazon.com/controltower/latest/userguide/network-firewall-rules.html#ct-network-firewall-pr-2-description) | Require any AWS Network Firewall firewall policy to drop or forward stateless full packets by default when they do not match a rule                              | `AWS::NetworkFirewall::FirewallPolicy`<br/>                                                         |
| [CT.NETWORK-FIREWALL.PR.3](https://docs.aws.amazon.com/controltower/latest/userguide/network-firewall-rules.html#ct-network-firewall-pr-3-description) | Require any AWS Network Firewall firewall policy to drop or forward fragmented packets by default when they do not match a stateless rule                        | `AWS::NetworkFirewall::FirewallPolicy`<br/>                                                         |
| [CT.NETWORK-FIREWALL.PR.4](https://docs.aws.amazon.com/controltower/latest/userguide/network-firewall-rules.html#ct-network-firewall-pr-4-description) | Require any AWS Network Firewall rule group to contain at least one rule                                                                                         | `AWS::NetworkFirewall::RuleGroup`<br/>                                                              |
| [CT.RDS.PR.1](https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-1-description)                                        | Require that an Amazon RDS database instance is configured with multiple Availability Zones                                                                      | `AWS::RDS::DBInstance`<br/>                                                                         |
| [CT.RDS.PR.2](https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-2-description)                                        | Require an Amazon RDS database instance or cluster to have enhanced monitoring configured                                                                        | `AWS::RDS::DBInstance`<br/>                                                                         |
| [CT.RDS.PR.3](https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-3-description)                                        | Require an Amazon RDS cluster to have deletion protection configured                                                                                             | `AWS::RDS::DBCluster`<br/>                                                                          |
| [CT.RDS.PR.4](https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-4-description)                                        | Require an Amazon RDS database cluster to have AWS IAM database authentication configured                                                                        | `AWS::RDS::DBCluster`<br/>                                                                          |
| [CT.RDS.PR.5](https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-5-description)                                        | Require an Amazon RDS database instance to have minor version upgrades configured                                                                                | `AWS::RDS::DBInstance`<br/>                                                                         |
| [CT.RDS.PR.6](https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-6-description)                                        | Require an Amazon RDS database cluster to have backtracking configured                                                                                           | `AWS::RDS::DBCluster`<br/>                                                                          |
| [CT.RDS.PR.7](https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-7-description)                                        | Require Amazon RDS database instances to have AWS IAM authentication configured                                                                                  | `AWS::RDS::DBInstance`<br/>                                                                         |
| [CT.RDS.PR.8](https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-8-description)                                        | Require an Amazon RDS database instance to have automatic backups configured                                                                                     | `AWS::RDS::DBInstance`<br/>                                                                         |
| [CT.RDS.PR.9](https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-9-description)                                        | Require an Amazon RDS database cluster to copy tags to snapshots                                                                                                 | `AWS::RDS::DBCluster`<br/>                                                                          |
| [CT.RDS.PR.10](https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-10-description)                                      | Require an Amazon RDS database instance to copy tags to snapshots                                                                                                | `AWS::RDS::DBInstance`<br/>                                                                         |
| [CT.RDS.PR.11](https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-11-description)                                      | Require an Amazon RDS database instance to have a VPC configuration                                                                                              | `AWS::RDS::DBInstance`<br/>                                                                         |
| [CT.RDS.PR.12](https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-12-description)                                      | Require an Amazon RDS event subscription to have critical cluster events configured                                                                              | `AWS::RDS::EventSubscription`<br/>                                                                  |
| [CT.RDS.PR.13](https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-13-description)                                      | Require any Amazon RDS instance to have deletion protection configured                                                                                           | `AWS::RDS::DBInstance`<br/>                                                                         |
| [CT.RDS.PR.14](https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-14-description)                                      | Require an Amazon RDS database instance to have logging configured                                                                                               | `AWS::RDS::DBInstance`<br/>                                                                         |
| [CT.RDS.PR.15](https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-15-description)                                      | Require that an Amazon RDS instance does not create DB security groups                                                                                           | `AWS::RDS::DBInstance`<br/>`AWS::RDS::DBSecurityGroup`<br/>                                         |
| [CT.RDS.PR.16](https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-16-description)                                      | Require an Amazon RDS database cluster to have encryption at rest configured                                                                                     | `AWS::RDS::DBCluster`<br/>                                                                          |
| [CT.RDS.PR.17](https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-17-description)                                      | Require an Amazon RDS event notification subscription to have critical database instance events configured                                                       | `AWS::RDS::EventSubscription`<br/>                                                                  |
| [CT.RDS.PR.18](https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-18-description)                                      | Require an Amazon RDS event notification subscription to have critical database parameter group events configured                                                | `AWS::RDS::EventSubscription`<br/>                                                                  |
| [CT.RDS.PR.19](https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-19-description)                                      | Require an Amazon RDS event notifications subscription to have critical database security group events configured                                                | `AWS::RDS::EventSubscription`<br/>                                                                  |
| [CT.RDS.PR.20](https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-20-description)                                      | Require an Amazon RDS database instance not to use a database engine default port                                                                                | `AWS::RDS::DBInstance`<br/>                                                                         |
| [CT.RDS.PR.21](https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-21-description)                                      | Require an Amazon RDS DB cluster to have a unique administrator username                                                                                         | `AWS::RDS::DBCluster`<br/>                                                                          |
| [CT.RDS.PR.22](https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-22-description)                                      | Require an Amazon RDS database instance to have a unique administrator username                                                                                  | `AWS::RDS::DBInstance`<br/>                                                                         |
| [CT.RDS.PR.23](https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-23-description)                                      | Require an Amazon RDS database instance to not be publicly accessible                                                                                            | `AWS::RDS::DBInstance`<br/>                                                                         |
| [CT.RDS.PR.24](https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-24-description)                                      | Require an Amazon RDS database instance to have encryption at rest configured                                                                                    | `AWS::RDS::DBInstance`<br/>                                                                         |
| [CT.REDSHIFT.PR.1](https://docs.aws.amazon.com/controltower/latest/userguide/redshift-rules.html#ct-redshift-pr-1-description)                         | Require an Amazon Redshift cluster to prohibit public access                                                                                                     | `AWS::Redshift::Cluster`<br/>                                                                       |
| [CT.REDSHIFT.PR.2](https://docs.aws.amazon.com/controltower/latest/userguide/redshift-rules.html#ct-redshift-pr-2-description)                         | Require an Amazon Redshift cluster to have automatic snapshots configured                                                                                        | `AWS::Redshift::Cluster`<br/>                                                                       |
| [CT.REDSHIFT.PR.3](https://docs.aws.amazon.com/controltower/latest/userguide/redshift-rules.html#ct-redshift-pr-3-description)                         | Require an Amazon Redshift cluster to have audit logging configured                                                                                              | `AWS::Redshift::Cluster`<br/>                                                                       |
| [CT.REDSHIFT.PR.4](https://docs.aws.amazon.com/controltower/latest/userguide/redshift-rules.html#ct-redshift-pr-4-description)                         | Require an Amazon Redshift cluster to have automatic upgrades to major versions configured                                                                       | `AWS::Redshift::Cluster`<br/>                                                                       |
| [CT.REDSHIFT.PR.5](https://docs.aws.amazon.com/controltower/latest/userguide/redshift-rules.html#ct-redshift-pr-5-description)                         | Require an Amazon Redshift cluster to have enhanced VPC routing                                                                                                  | `AWS::Redshift::Cluster`<br/>                                                                       |
| [CT.REDSHIFT.PR.6](https://docs.aws.amazon.com/controltower/latest/userguide/redshift-rules.html#ct-redshift-pr-6-description)                         | Require an Amazon Redshift cluster to have a unique administrator username                                                                                       | `AWS::Redshift::Cluster`<br/>                                                                       |
| [CT.REDSHIFT.PR.7](https://docs.aws.amazon.com/controltower/latest/userguide/redshift-rules.html#ct-redshift-pr-7-description)                         | Require an Amazon Redshift cluster to have a unique database name                                                                                                | `AWS::Redshift::Cluster`<br/>                                                                       |
| [CT.S3.PR.1](https://docs.aws.amazon.com/controltower/latest/userguide/s3-rules.html#ct-s3-pr-1-description)                                           | Require an Amazon S3 bucket to have block public access settings configured                                                                                      | `AWS::S3::Bucket`<br/>                                                                              |
| [CT.S3.PR.2](https://docs.aws.amazon.com/controltower/latest/userguide/s3-rules.html#ct-s3-pr-2-description)                                           | Require an Amazon S3 bucket to have server access logging configured                                                                                             | `AWS::S3::Bucket`<br/>                                                                              |
| [CT.S3.PR.3](https://docs.aws.amazon.com/controltower/latest/userguide/s3-rules.html#ct-s3-pr-3-description)                                           | Require an Amazon S3 buckets to have versioning configured and a lifecycle policy                                                                                | `AWS::S3::Bucket`<br/>                                                                              |
| [CT.S3.PR.4](https://docs.aws.amazon.com/controltower/latest/userguide/s3-rules.html#ct-s3-pr-4-description)                                           | Require an Amazon S3 bucket to have event notifications configured                                                                                               | `AWS::S3::Bucket`<br/>                                                                              |
| [CT.S3.PR.5](https://docs.aws.amazon.com/controltower/latest/userguide/s3-rules.html#ct-s3-pr-5-description)                                           | Require that an Amazon S3 bucket does not manage user access with an access control list (ACL)                                                                   | `AWS::S3::Bucket`<br/>                                                                              |
| [CT.S3.PR.6](https://docs.aws.amazon.com/controltower/latest/userguide/s3-rules.html#ct-s3-pr-6-description)                                           | Require an Amazon S3 bucket to have lifecycle policies configured                                                                                                | `AWS::S3::Bucket`<br/>                                                                              |
| [CT.S3.PR.7](https://docs.aws.amazon.com/controltower/latest/userguide/s3-rules.html#ct-s3-pr-7-description)                                           | Require an Amazon S3 bucket to have server-side encryption configured                                                                                            | `AWS::S3::Bucket`<br/>                                                                              |
| [CT.S3.PR.8](https://docs.aws.amazon.com/controltower/latest/userguide/s3-rules.html#ct-s3-pr-8-description)                                           | Require that Amazon S3 bucket requests use Secure Sockets Layer                                                                                                  | `AWS::S3::BucketPolicy`<br/>                                                                        |
| [CT.SQS.PR.1](https://docs.aws.amazon.com/controltower/latest/userguide/sqs-rules.html#ct-sqs-pr-1-description)                                        | Require any Amazon SQS queue to have a dead-letter queue configured                                                                                              | `AWS::SQS::Queue`<br/>                                                                              |
| [CT.SQS.PR.2](https://docs.aws.amazon.com/controltower/latest/userguide/sqs-rules.html#ct-sqs-pr-2-description)                                        | Require any Amazon SQS queue to have encryption at rest configured                                                                                               | `AWS::SQS::Queue`<br/>                                                                              |
| [CT.WAF-REGIONAL.PR.1](https://docs.aws.amazon.com/controltower/latest/userguide/waf-regional-rules.html#ct-waf-regional-pr-1-description)             | Require any AWS WAF regional rule to have a condition                                                                                                            | `AWS::WAFRegional::Rule`<br/>                                                                       |
| [CT.WAF-REGIONAL.PR.2](https://docs.aws.amazon.com/controltower/latest/userguide/waf-regional-rules.html#ct-waf-regional-pr-2-description)             | Require any AWS WAF regional web access control list (ACL) to have a rule or rule group                                                                          | `AWS::WAFRegional::WebACL`<br/>                                                                     |
| [CT.WAF.PR.1](https://docs.aws.amazon.com/controltower/latest/userguide/waf-rules.html#ct-waf-pr-1-description)                                        | Require any AWS WAF global rule to have a condition                                                                                                              | `AWS::WAF::Rule`<br/>                                                                               |
| [CT.WAF.PR.2](https://docs.aws.amazon.com/controltower/latest/userguide/waf-rules.html#ct-waf-pr-2-description)                                        | Require any AWS WAF global web ACL to have a rule or rule group                                                                                                  | `AWS::WAF::WebACL`<br/>                                                                             |
| [CT.WAFV2.PR.1](https://docs.aws.amazon.com/controltower/latest/userguide/wafv2-rules.html#ct-wafv2-pr-1-description)                                  | Require an AWS WAFV2 web ACL to be non-empty                                                                                                                     | `AWS::WAFv2::WebACL`<br/>                                                                           |
| [CT.WAFV2.PR.2](https://docs.aws.amazon.com/controltower/latest/userguide/wafv2-rules.html#ct-wafv2-pr-2-description)                                  | Require an AWS WAFV2 rule group to be non-empty                                                                                                                  | `AWS::WAFv2::RuleGroup`<br/>                                                                        |

# API Reference <a name="API Reference" id="api-reference"></a>


## Structs <a name="Structs" id="Structs"></a>

### CfnGuardValidatorProps <a name="CfnGuardValidatorProps" id="@cdklabs/cdk-validator-cfnguard.CfnGuardValidatorProps"></a>

#### Initializer <a name="Initializer" id="@cdklabs/cdk-validator-cfnguard.CfnGuardValidatorProps.Initializer"></a>

```typescript
import { CfnGuardValidatorProps } from '@cdklabs/cdk-validator-cfnguard'

const cfnGuardValidatorProps: CfnGuardValidatorProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@cdklabs/cdk-validator-cfnguard.CfnGuardValidatorProps.property.controlTowerRulesEnabled">controlTowerRulesEnabled</a></code> | <code>boolean</code> | Enable the default Control Tower Guard rules. |
| <code><a href="#@cdklabs/cdk-validator-cfnguard.CfnGuardValidatorProps.property.disabledRules">disabledRules</a></code> | <code>string[]</code> | List of rule names to disable. |
| <code><a href="#@cdklabs/cdk-validator-cfnguard.CfnGuardValidatorProps.property.rules">rules</a></code> | <code>string[]</code> | Local file paths to either a directory containing guard rules, or to an individual guard rule file. |

---

##### `controlTowerRulesEnabled`<sup>Optional</sup> <a name="controlTowerRulesEnabled" id="@cdklabs/cdk-validator-cfnguard.CfnGuardValidatorProps.property.controlTowerRulesEnabled"></a>

```typescript
public readonly controlTowerRulesEnabled: boolean;
```

- *Type:* boolean
- *Default:* true

Enable the default Control Tower Guard rules.

---

##### `disabledRules`<sup>Optional</sup> <a name="disabledRules" id="@cdklabs/cdk-validator-cfnguard.CfnGuardValidatorProps.property.disabledRules"></a>

```typescript
public readonly disabledRules: string[];
```

- *Type:* string[]
- *Default:* no rules are disabled

List of rule names to disable.

---

##### `rules`<sup>Optional</sup> <a name="rules" id="@cdklabs/cdk-validator-cfnguard.CfnGuardValidatorProps.property.rules"></a>

```typescript
public readonly rules: string[];
```

- *Type:* string[]
- *Default:* no local rules will be used

Local file paths to either a directory containing guard rules, or to an individual guard rule file.

If the path is to a directory then the directory must
only contain guard rule and the plugin will use
all the rules in the directory

---

## Classes <a name="Classes" id="Classes"></a>

### CfnGuardValidator <a name="CfnGuardValidator" id="@cdklabs/cdk-validator-cfnguard.CfnGuardValidator"></a>

- *Implements:* aws-cdk-lib.IPolicyValidationPluginBeta1

A validation plugin using CFN Guard.

#### Initializers <a name="Initializers" id="@cdklabs/cdk-validator-cfnguard.CfnGuardValidator.Initializer"></a>

```typescript
import { CfnGuardValidator } from '@cdklabs/cdk-validator-cfnguard'

new CfnGuardValidator(props?: CfnGuardValidatorProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@cdklabs/cdk-validator-cfnguard.CfnGuardValidator.Initializer.parameter.props">props</a></code> | <code><a href="#@cdklabs/cdk-validator-cfnguard.CfnGuardValidatorProps">CfnGuardValidatorProps</a></code> | *No description.* |

---

##### `props`<sup>Optional</sup> <a name="props" id="@cdklabs/cdk-validator-cfnguard.CfnGuardValidator.Initializer.parameter.props"></a>

- *Type:* <a href="#@cdklabs/cdk-validator-cfnguard.CfnGuardValidatorProps">CfnGuardValidatorProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@cdklabs/cdk-validator-cfnguard.CfnGuardValidator.validate">validate</a></code> | The method that will be called by the CDK framework to perform validations. |

---

##### `validate` <a name="validate" id="@cdklabs/cdk-validator-cfnguard.CfnGuardValidator.validate"></a>

```typescript
public validate(context: IPolicyValidationContextBeta1): PolicyValidationPluginReportBeta1
```

The method that will be called by the CDK framework to perform validations.

This is where the plugin will evaluate the CloudFormation
templates for compliance and report and violations

###### `context`<sup>Required</sup> <a name="context" id="@cdklabs/cdk-validator-cfnguard.CfnGuardValidator.validate.parameter.context"></a>

- *Type:* aws-cdk-lib.IPolicyValidationContextBeta1

---


#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@cdklabs/cdk-validator-cfnguard.CfnGuardValidator.property.name">name</a></code> | <code>string</code> | The name of the plugin that will be displayed in the validation report. |

---

##### `name`<sup>Required</sup> <a name="name" id="@cdklabs/cdk-validator-cfnguard.CfnGuardValidator.property.name"></a>

```typescript
public readonly name: string;
```

- *Type:* string

The name of the plugin that will be displayed in the validation report.

---



