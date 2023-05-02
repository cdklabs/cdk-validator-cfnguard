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


| Control Tower rule ID         | Control Tower docs link                                                                                                    | Description                                                                                                                                                                                                                                                                                                         |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CT.ACM.PR.1                   | https://docs.aws.amazon.com/controltower/latest/userguide/acm-rules.html#ct-acm-pr-1-description                           | This control checks whether any AWS Certificate Manager (ACM) Private CA certificates have wildcard domain names instead of single domain names.                                                                                                                                                                    |
| CT.APIGATEWAY.PR.1            | https://docs.aws.amazon.com/controltower/latest/userguide/api-gateway-rules.html#ct-apigateway-pr-1-description            | This control checks whether all methods in Amazon API Gateway stage have execution logging configured.                                                                                                                                                                                                              |
| CT.APIGATEWAY.PR.2            | https://docs.aws.amazon.com/controltower/latest/userguide/api-gateway-rules.html#ct-apigateway-pr-2-description            | This control ensures that AWS X-Ray tracing is enabled on Amazon API Gateway REST APIs.                                                                                                                                                                                                                             |
| CT.APIGATEWAY.PR.3            | https://docs.aws.amazon.com/controltower/latest/userguide/api-gateway-rules.html#ct-apigateway-pr-3-description            | This control checks whether an Amazon API Gateway REST API stage that has caching enabled also encrypts the caches.                                                                                                                                                                                                 |
| CT.APIGATEWAY.PR.4            | https://docs.aws.amazon.com/controltower/latest/userguide/api-gateway-rules.html#ct-apigateway-pr-4-description            | This control checks whether Amazon API Gateway V2 stages have access logging enabled. Access logging is supported for HTTP and WebSocket APIs.                                                                                                                                                                      |
| CT.CLOUDFRONT.PR.1            | https://docs.aws.amazon.com/controltower/latest/userguide/cloudfront-rules.html#ct-cloudfront-pr-1-description             | This control checks whether an Amazon CloudFront distribution is configured to return a specific object that is the default root object.                                                                                                                                                                            |
| CT.CLOUDFRONT.PR.3            | https://docs.aws.amazon.com/controltower/latest/userguide/cloudfront-rules.html#ct-cloudfront-pr-3-description             | This control checks whether your Amazon CloudFront distributions use HTTPS, either directly or through a redirection.                                                                                                                                                                                               |
| CT.CLOUDFRONT.PR.4            | https://docs.aws.amazon.com/controltower/latest/userguide/cloudfront-rules.html#ct-cloudfront-pr-4-description             | This control checks whether your Amazon CloudFront distribution is configured with an origin group that contains two origin group members.                                                                                                                                                                          |
| CT.CLOUDFRONT.PR.5            | https://docs.aws.amazon.com/controltower/latest/userguide/cloudfront-rules.html#ct-cloudfront-pr-5-description             | This control checks whether Amazon CloudFront distributions are configured with access logging.                                                                                                                                                                                                                     |
| CT.CLOUDFRONT.PR.6            | https://docs.aws.amazon.com/controltower/latest/userguide/cloudfront-rules.html#ct-cloudfront-pr-6-description             | This control checks whether the certificate associated with an Amazon CloudFront distribution is a custom SSL/TLS certificate.                                                                                                                                                                                      |
| CT.CLOUDFRONT.PR.7            | https://docs.aws.amazon.com/controltower/latest/userguide/cloudfront-rules.html#ct-cloudfront-pr-7-description             | This control checks whether your Amazon CloudFront distributions are configured to use SNI to serve HTTPS requests.                                                                                                                                                                                                 |
| CT.CLOUDFRONT.PR.8            | https://docs.aws.amazon.com/controltower/latest/userguide/cloudfront-rules.html#ct-cloudfront-pr-8-description             | This control checks whether your Amazon CloudFront distributions are encrypting traffic to custom origins.                                                                                                                                                                                                          |
| CT.CLOUDFRONT.PR.9            | https://docs.aws.amazon.com/controltower/latest/userguide/cloudfront-rules.html#ct-cloudfront-pr-9-description             | This control checks whether your Amazon CloudFront distributions are using a minimum security policy and cipher suite of TLSv1.2 or greater for viewer connections.                                                                                                                                                 |
| CT.CLOUDFRONT.PR.10           | https://docs.aws.amazon.com/controltower/latest/userguide/cloudfront-rules.html#ct-cloudfront-pr-10-description            | This control checks whether your Amazon CloudFront distributions backed by Amazon S3 are configured to use an origin access control.                                                                                                                                                                                |
| CT.CLOUDFRONT.PR.11           | https://docs.aws.amazon.com/controltower/latest/userguide/cloudfront-rules.html#ct-cloudfront-pr-11-description            | This control checks whether your Amazon CloudFront distributions are using deprecated SSL protocols for HTTPS communication between CloudFront edge locations and custom origins.                                                                                                                                   |
| CT.CLOUDTRAIL.PR.1            | https://docs.aws.amazon.com/controltower/latest/userguide/cloudtrail-rules.html#ct-cloudtrail-pr-1-description             | This control checks whether your AWS CloudTrail is configured to use the server-side encryption (SSE) AWS KMS key encryption.                                                                                                                                                                                       |
| CT.CLOUDTRAIL.PR.2            | https://docs.aws.amazon.com/controltower/latest/userguide/cloudtrail-rules.html#ct-cloudtrail-pr-2-description             | This control checks whether log file integrity validation is enabled on an AWS CloudTrail trail.                                                                                                                                                                                                                    |
| CT.CLOUDTRAIL.PR.3            | https://docs.aws.amazon.com/controltower/latest/userguide/cloudtrail-rules.html#ct-cloudtrail-pr-3-description             | This control checks whether your AWS CloudTrail trail is configured to send logs to Amazon CloudWatch Logs.                                                                                                                                                                                                         |
| CT.CODEBUILD.PR.1             | https://docs.aws.amazon.com/controltower/latest/userguide/codebuild-rules.html#ct-codebuild-pr-1-description               | This control checks whether the GitHub or Bitbucket source repository URL contains either personal access tokens or a username and password.                                                                                                                                                                        |
| CT.CODEBUILD.PR.2             | https://docs.aws.amazon.com/controltower/latest/userguide/codebuild-rules.html#ct-codebuild-pr-2-description               | This control checks whether AWS CodeBuild projects contain environment variables 'AWS_ACCESS_KEY_ID' and 'AWS_SECRET_ACCESS_KEY' stored as 'PLAINTEXT'.                                                                                                                                                             |
| CT.CODEBUILD.PR.3             | https://docs.aws.amazon.com/controltower/latest/userguide/codebuild-rules.html#ct-codebuild-pr-3-description               | This control checks whether AWS CodeBuild projects environment has at least one logging option enabled.                                                                                                                                                                                                             |
| CT.CODEBUILD.PR.4             | https://docs.aws.amazon.com/controltower/latest/userguide/codebuild-rules.html#ct-codebuild-pr-4-description               | This control checks whether AWS CodeBuild projects have privileged mode turned off.                                                                                                                                                                                                                                 |
| CT.CODEBUILD.PR.5             | https://docs.aws.amazon.com/controltower/latest/userguide/codebuild-rules.html#ct-codebuild-pr-5-description               | This control checks whether AWS CodeBuild projects are configured to encrypt artifacts.                                                                                                                                                                                                                             |
| CT.CODEBUILD.PR.6             | https://docs.aws.amazon.com/controltower/latest/userguide/codebuild-rules.html#ct-codebuild-pr-6-description               | This control checks whether AWS CodeBuild projects configured with Amazon S3 logs have encryption enabled.                                                                                                                                                                                                          |
| CT.DAX.PR.1                   | https://docs.aws.amazon.com/controltower/latest/userguide/dax-rules.html#ct-dax-pr-1-description                           | This control checks whether Amazon DynamoDB Accelerator (DAX) clusters are encrypted at rest.                                                                                                                                                                                                                       |
| CT.DMS.PR.1                   | https://docs.aws.amazon.com/controltower/latest/userguide/dms-rules.html#ct-dms-pr-1-description                           | This control checks whether your AWS DMS replication instance is public.                                                                                                                                                                                                                                            |
| CT.DYNAMODB.PR.1              | https://docs.aws.amazon.com/controltower/latest/userguide/dynamodb-rules.html#ct-dynamodb-pr-1-description                 | This control checks whether point-in-time recovery (PITR) is enabled for an Amazon DynamoDB table.                                                                                                                                                                                                                  |
| CT.EC2.PR.1                   | https://docs.aws.amazon.com/controltower/latest/userguide/ec2-rules.html#ct-ec2-pr-1-description                           | This control checks whether your Amazon EC2 launch templates are configured with Instance Metadata Service Version 2 (IMDSv2).                                                                                                                                                                                      |
| CT.EC2.PR.2                   | https://docs.aws.amazon.com/controltower/latest/userguide/ec2-rules.html#ct-ec2-pr-2-description                           | This control checks whether an Amazon EC2 launch template has a metadata token hop limit set to '1'.                                                                                                                                                                                                                |
| CT.EC2.PR.3                   | https://docs.aws.amazon.com/controltower/latest/userguide/ec2-rules.html#ct-ec2-pr-3-description                           | This control checks whether security groups that allow unrestricted incoming traffic ('0.0.0.0/0' or '::/0'), only allow inbound TCP or UDP connections on authorized ports.                                                                                                                                        |
| CT.EC2.PR.4                   | https://docs.aws.amazon.com/controltower/latest/userguide/ec2-rules.html#ct-ec2-pr-4-description                           | This control checks whether Amazon EC2 security groups allow unrestricted incoming TCP or UDP traffic to ports '3389', '20', '23', '110', '143', '3306', '8080', '1433', '9200', '9300', '25', '445', '135', '21', '1434', '4333', '5432', '5500', '5601', '22', '3000', '5000', '8088', '8888'.                    |
| CT.EC2.PR.5                   | https://docs.aws.amazon.com/controltower/latest/userguide/ec2-rules.html#ct-ec2-pr-5-description                           | This control checks whether the Amazon EC2 network ACL inbound entry allows unrestricted incoming traffic ('0.0.0.0/0' or '::/0') for SSH or RDP.                                                                                                                                                                   |
| CT.EC2.PR.6                   | https://docs.aws.amazon.com/controltower/latest/userguide/ec2-rules.html#ct-ec2-pr-6-description                           | This control checks whether Amazon EC2 transit gateways are configured to accept Amazon VPC attachment requests automatically.                                                                                                                                                                                      |
| CT.EC2.PR.7                   | https://docs.aws.amazon.com/controltower/latest/userguide/ec2-rules.html#ct-ec2-pr-7-description                           | This control checks whether your standalone Amazon EC2 EBS volumes and new EC2 EBS volumes created through EC2 instance block device mappings are encrypted at rest.                                                                                                                                                |
| CT.EC2.PR.8                   | https://docs.aws.amazon.com/controltower/latest/userguide/ec2-rules.html#ct-ec2-pr-8-description                           | This control checks whether your Amazon EC2 instance is configured to associate a public IP address.                                                                                                                                                                                                                |
| CT.EC2.PR.9                   | https://docs.aws.amazon.com/controltower/latest/userguide/ec2-rules.html#ct-ec2-pr-9-description                           | This control checks whether your Amazon EC2 launch templates are configured to assign public IP addresses to network interfaces.                                                                                                                                                                                    |
| CT.EC2.PR.10                  | https://docs.aws.amazon.com/controltower/latest/userguide/ec2-rules.html#ct-ec2-pr-10-description                          | This control checks whether the Amazon EC2 launch template has detailed monitoring enabled.                                                                                                                                                                                                                         |
| CT.EC2.PR.11                  | https://docs.aws.amazon.com/controltower/latest/userguide/ec2-rules.html#ct-ec2-pr-11-description                          | This control checks whether your Amazon VPC subnets automatically assign public IP addresses.                                                                                                                                                                                                                       |
| CT.EC2.PR.12                  | https://docs.aws.amazon.com/controltower/latest/userguide/ec2-rules.html#ct-ec2-pr-12-description                          | This control checks whether your Amazon Elastic Compute Cloud (Amazon EC2) instance uses multiple ENIs (Elastic Network Interfaces).                                                                                                                                                                                |
| CT.ECR.PR.1                   | https://docs.aws.amazon.com/controltower/latest/userguide/ecr-rules.html#ct-ecr-pr-1-description                           | This control checks whether a private Amazon Elastic Container Registry (ECR) repository has at least one lifecycle policy configured.                                                                                                                                                                              |
| CT.ECR.PR.2                   | https://docs.aws.amazon.com/controltower/latest/userguide/ecr-rules.html#ct-ecr-pr-2-description                           | This control checks whether a private Amazon ECR repository has image scanning enabled.                                                                                                                                                                                                                             |
| CT.ECR.PR.3                   | https://docs.aws.amazon.com/controltower/latest/userguide/ecr-rules.html#ct-ecr-pr-3-description                           | This control checks whether a private Amazon ECR repository has tag immutability enabled.                                                                                                                                                                                                                           |
| CT.ECS.PR.1                   | https://docs.aws.amazon.com/controltower/latest/userguide/ecs-rules.html#ct-ecs-pr-1-description                           | This control checks whether Amazon ECS Fargate services are configured to deploy using the 'LATEST' platform version rather than a specified version number.                                                                                                                                                        |
| CT.ECS.PR.2                   | https://docs.aws.amazon.com/controltower/latest/userguide/ecs-rules.html#ct-ecs-pr-2-description                           | This control checks whether your Amazon ECS clusters have container insights enabled.                                                                                                                                                                                                                               |
| CT.ECS.PR.3                   | https://docs.aws.amazon.com/controltower/latest/userguide/ecs-rules.html#ct-ecs-pr-3-description                           | This control checks whether Amazon Elastic Container Service (ECS) task definitions run as a non-root user within Amazon ECS containers.                                                                                                                                                                            |
| CT.ECS.PR.4                   | https://docs.aws.amazon.com/controltower/latest/userguide/ecs-rules.html#ct-ecs-pr-4-description                           | This control checks whether the networking mode for Amazon Elastic Container Service (ECS) task definitions is set to 'awsvpc'.                                                                                                                                                                                     |
| CT.ECS.PR.5                   | https://docs.aws.amazon.com/controltower/latest/userguide/ecs-rules.html#ct-ecs-pr-5-description                           | This control checks whether Amazon Elastic Container Service (ECS) task definitions have a logging configuration specified.                                                                                                                                                                                         |
| CT.ECS.PR.6                   | https://docs.aws.amazon.com/controltower/latest/userguide/ecs-rules.html#ct-ecs-pr-6-description                           | This control checks whether Amazon ECS task definitions have been configured to require read-only access to container root filesystems.                                                                                                                                                                             |
| CT.ECS.PR.7                   | https://docs.aws.amazon.com/controltower/latest/userguide/ecs-rules.html#ct-ecs-pr-7-description                           | This control checks whether Amazon Elastic Container Service (ECS) task definitions have specified a memory limit for container definitions.                                                                                                                                                                        |
| CT.ECS.PR.8                   | https://docs.aws.amazon.com/controltower/latest/userguide/ecs-rules.html#ct-ecs-pr-8-description                           | This control checks whether Amazon Elastic Container Service (ECS) task definitions that use 'host' networking mode have a privileged container definition, and whether they specify a non-root user definition.                                                                                                    |
| CT.ECS.PR.9                   | https://docs.aws.amazon.com/controltower/latest/userguide/ecs-rules.html#ct-ecs-pr-9-description                           | This control checks whether your Amazon ECS services are configured to assign public IP addresses automatically.                                                                                                                                                                                                    |
| CT.ECS.PR.10                  | https://docs.aws.amazon.com/controltower/latest/userguide/ecs-rules.html#ct-ecs-pr-10-description                          | This control checks whether Amazon Elastic Container Service (ECS) task definitions are configured to share a host's process namespace with its containers.                                                                                                                                                         |
| CT.ECS.PR.11                  | https://docs.aws.amazon.com/controltower/latest/userguide/ecs-rules.html#ct-ecs-pr-11-description                          | This control checks whether container definitions in Amazon Elastic Container Service (ECS) task definitions are configured with elevated privileges.                                                                                                                                                               |
| CT.ECS.PR.12                  | https://docs.aws.amazon.com/controltower/latest/userguide/ecs-rules.html#ct-ecs-pr-12-description                          | This control checks whether Amazon Elastic Container Service (ECS) task definition container definitions include environment variables named 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', or 'ECS_ENGINE_AUTH_DATA'.                                                                                               |
| CT.ELASTICBEANSTALK.PR.1      | https://docs.aws.amazon.com/controltower/latest/userguide/ebs-rules.html#ct-elasticbeanstalk-pr-1-description              | This control checks whether AWS Elastic Beanstalk environments and configuration templates are configured for 'enhanced' health reporting.                                                                                                                                                                          |
| CT.ELASTICBEANSTALK.PR.2      | https://docs.aws.amazon.com/controltower/latest/userguide/ebs-rules.html#ct-elasticbeanstalk-pr-2-description              | This control checks whether managed platform updates in AWS Elastic Beanstalk environments and configuration templates are activated.                                                                                                                                                                               |
| CT.ELASTICFILESYSYSTEM.PR.1   | https://docs.aws.amazon.com/controltower/latest/userguide/efs-rules.html#ct-elasticfilesysystem-pr-1-description           | This control checks whether an Amazon EFS file system is configured to encrypt file data using AWS KMS.                                                                                                                                                                                                             |
| CT.ELASTICFILESYSYSTEM.PR.2   | https://docs.aws.amazon.com/controltower/latest/userguide/efs-rules.html#ct-elasticfilesysystem-pr-2-description           | This control checks whether your Amazon EFS file system has been configured with automatic backups through AWS Backup.                                                                                                                                                                                              |
| CT.ELASTICFILESYSYSTEM.PR.3   | https://docs.aws.amazon.com/controltower/latest/userguide/efs-rules.html#ct-elasticfilesysystem-pr-3-description           | This control checks whether your Amazon EFS access points are configured to enforce a root directory.                                                                                                                                                                                                               |
| CT.ELASTICFILESYSYSTEM.PR.4   | https://docs.aws.amazon.com/controltower/latest/userguide/efs-rules.html#ct-elasticfilesysystem-pr-4-description           | This control checks whether your Amazon EFS access points are configured to enforce a user identity.                                                                                                                                                                                                                |
| CT.ELASTICLOADBALANCING.PR.1  | https://docs.aws.amazon.com/controltower/latest/userguide/elb-rules.html#ct-elasticloadbalancing-pr-1-description          | This control checks whether HTTP to HTTPS redirection is configured as a default action on HTTP listeners of application load balancers.                                                                                                                                                                            |
| CT.ELASTICLOADBALANCING.PR.2  | https://docs.aws.amazon.com/controltower/latest/userguide/elb-rules.html#ct-elasticloadbalancing-pr-2-description          | This control checks whether your Amazon Elastic Load Balancing (ELB) application and network load balancers use certificates provided by AWS Certificate Manager (ACM).                                                                                                                                             |
| CT.ELASTICLOADBALANCING.PR.3  | https://docs.aws.amazon.com/controltower/latest/userguide/elb-rules.html#ct-elasticloadbalancing-pr-3-description          | This control checks to ensure that an application load balancer is configured with 'defensive' or 'strictest' desync mitigation mode.                                                                                                                                                                               |
| CT.ELASTICLOADBALANCING.PR.4  | https://docs.aws.amazon.com/controltower/latest/userguide/elb-rules.html#ct-elasticloadbalancing-pr-4-description          | This control checks whether application load balancers are configured to drop non-valid HTTP headers.                                                                                                                                                                                                               |
| CT.ELASTICLOADBALANCING.PR.5  | https://docs.aws.amazon.com/controltower/latest/userguide/elb-rules.html#ct-elasticloadbalancing-pr-5-description          | Checks whether an Elastic Load Balancer (ELB) has deletion protection activated.                                                                                                                                                                                                                                    |
| CT.ELASTICLOADBALANCING.PR.6  | https://docs.aws.amazon.com/controltower/latest/userguide/elb-rules.html#ct-elasticloadbalancing-pr-6-description          | This control checks whether your ELB application and network load balancers have logging activated.                                                                                                                                                                                                                 |
| CT.ELASTICLOADBALANCING.PR.7  | https://docs.aws.amazon.com/controltower/latest/userguide/elb-rules.html#ct-elasticloadbalancing-pr-7-description          | This control checks whether an ELB classic load balancer has been configured with multiple Availability Zones.                                                                                                                                                                                                      |
| CT.ELASTICLOADBALANCING.PR.8  | https://docs.aws.amazon.com/controltower/latest/userguide/elb-rules.html#ct-elasticloadbalancing-pr-8-description          | This control checks whether classic load balancers use HTTPS/SSL certificates provided by AWS Certificate Manager.                                                                                                                                                                                                  |
| CT.ELASTICLOADBALANCING.PR.9  | https://docs.aws.amazon.com/controltower/latest/userguide/elb-rules.html#ct-elasticloadbalancing-pr-9-description          | This control checks whether your AWS Elastic Load Balancing (ELB) classic load balancer front-end listeners are configured with HTTPS or SSL protocols.                                                                                                                                                             |
| CT.ELASTICLOADBALANCING.PR.10 | https://docs.aws.amazon.com/controltower/latest/userguide/elb-rules.html#ct-elasticloadbalancing-pr-10-description         | This control checks whether classic load balancers have logging enabled.                                                                                                                                                                                                                                            |
| CT.ELASTICLOADBALANCING.PR.11 | https://docs.aws.amazon.com/controltower/latest/userguide/elb-rules.html#ct-elasticloadbalancing-pr-11-description         | This control checks whether ELB classic load balancers have connection draining configured.                                                                                                                                                                                                                         |
| CT.ELASTICLOADBALANCING.PR.12 | https://docs.aws.amazon.com/controltower/latest/userguide/elb-rules.html#ct-elasticloadbalancing-pr-12-description         | This control checks whether ELB classic load balancer HTTPS/SSL listeners use the predefined security policy 'ELBSecurityPolicy-TLS-1-2-2017-01'.                                                                                                                                                                   |
| CT.ELASTICLOADBALANCING.PR.13 | https://docs.aws.amazon.com/controltower/latest/userguide/elb-rules.html#ct-elasticloadbalancing-pr-13-description         | This control checks whether cross-zone load balancing is configured for your classic load balancer.                                                                                                                                                                                                                 |
| CT.GUARDDUTY.PR.1             | https://docs.aws.amazon.com/controltower/latest/userguide/guard-duty-rules.html#ct-guardduty-pr-1-description              | This control checks whether Amazon S3 protection is enabled on an Amazon GuardDuty detector.                                                                                                                                                                                                                        |
| CT.IAM.PR.1                   | https://docs.aws.amazon.com/controltower/latest/userguide/iam-rules.html#ct-iam-pr-1-description                           | This control checks that AWS Identity and Access Management (IAM) inline policies do not include "Effect": "Allow" with "Action": "*" over "Resource": "*".                                                                                                                                                         |
| CT.IAM.PR.2                   | https://docs.aws.amazon.com/controltower/latest/userguide/iam-rules.html#ct-iam-pr-2-description                           | This control checks whether AWS Identity and Access Management (IAM) customer managed policies do not include "Effect": "Allow" with "Action": "*" over "Resource": "*".                                                                                                                                            |
| CT.IAM.PR.3                   | https://docs.aws.amazon.com/controltower/latest/userguide/iam-rules.html#ct-iam-pr-3-description                           | This control checks that AWS Identity and Access Management (IAM) customer-managed policies do not contain statements of "Effect": "Allow" with "Action": "Service:*" (for example, s3:*) for individual AWS services, and that the policies do not use the combination of "NotAction" with an "Effect" of "Allow". |
| CT.IAM.PR.4                   | https://docs.aws.amazon.com/controltower/latest/userguide/iam-rules.html#ct-iam-pr-4-description                           | This control checks whether your AWS Identity and Access Management (IAM) user has inline or managed (AWS and customer) policies directly attached. Instead, IAM users should inherit permissions from IAM groups or roles.                                                                                         |
| CT.IAM.PR.5                   | https://docs.aws.amazon.com/controltower/latest/userguide/iam-rules.html#ct-iam-pr-5-description                           | This control checks whether AWS Identity and Access Management (IAM) inline policies do not include "Effect": "Allow" with "Action": "Service:*" (e.g. s3:*) for individual AWS services or use the combination of "NotAction" with an "Effect" of "Allow".                                                         |
| CT.KINESIS.PR.1               | https://docs.aws.amazon.com/controltower/latest/userguide/kinesis-rules.html#ct-kinesis-pr-1-description                   | This control checks whether Amazon Kinesis data streams are encrypted at rest with server-side encryption.                                                                                                                                                                                                          |
| CT.KMS.PR.1                   | https://docs.aws.amazon.com/controltower/latest/userguide/kms-rules.html#ct-kms-pr-1-description                           | This control checks whether key rotation is enabled for AWS KMS customer-managed keys.                                                                                                                                                                                                                              |
| CT.LAMBDA.PR.2                | https://docs.aws.amazon.com/controltower/latest/userguide/lambda-rules.html#ct-lambda-pr-2-description                     | This control checks whether an AWS Lambda function resource-based policy prohibits public access.                                                                                                                                                                                                                   |
| CT.NETWORK-FIREWALL.PR.1      | https://docs.aws.amazon.com/controltower/latest/userguide/network-firewall-rules.html#ct-network-firewall-pr-1-description | This control checks whether there is at least one stateful or stateless rule group associated with an AWS Network Firewall firewall policy.                                                                                                                                                                         |
| CT.NETWORK-FIREWALL.PR.2      | https://docs.aws.amazon.com/controltower/latest/userguide/network-firewall-rules.html#ct-network-firewall-pr-2-description | This control checks whether an AWS Network Firewall firewall policy is configured with a user-defined stateless default action for full packets.                                                                                                                                                                    |
| CT.NETWORK-FIREWALL.PR.3      | https://docs.aws.amazon.com/controltower/latest/userguide/network-firewall-rules.html#ct-network-firewall-pr-3-description | This control checks whether an AWS Network Firewall firewall policy is configured with a default action to drop or forward fragmented packets, when the packets do not match a stateless rule.                                                                                                                      |
| CT.NETWORK-FIREWALL.PR.4      | https://docs.aws.amazon.com/controltower/latest/userguide/network-firewall-rules.html#ct-network-firewall-pr-4-description | This control checks whether an AWS Network Firewall stateless rule group contains rules.                                                                                                                                                                                                                            |
| CT.RDS.PR.1                   | https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-1-description                           | This control checks whether high availability is configured for your Amazon RDS database instances.                                                                                                                                                                                                                 |
| CT.RDS.PR.2                   | https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-2-description                           | This control checks whether enhanced monitoring is activated for Amazon RDS instances.                                                                                                                                                                                                                              |
| CT.RDS.PR.3                   | https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-3-description                           | This control checks whether your Amazon Relational Database Service (Amazon RDS) cluster has deletion protection activated.                                                                                                                                                                                         |
| CT.RDS.PR.4                   | https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-4-description                           | This control checks whether an Amazon Relational Database Service (RDS) database (DB) cluster has AWS IAM database authentication activated.                                                                                                                                                                        |
| CT.RDS.PR.5                   | https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-5-description                           | This control checks whether automatic minor version upgrades are enabled for an Amazon RDS database instance.                                                                                                                                                                                                       |
| CT.RDS.PR.6                   | https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-6-description                           | This control checks whether an Amazon Relational Database Service (RDS) database (DB) cluster has backtracking enabled.                                                                                                                                                                                             |
| CT.RDS.PR.7                   | https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-7-description                           | This control checks whether an Amazon RDS database (DB) instance has AWS IAM database authentication activated.                                                                                                                                                                                                     |
| CT.RDS.PR.8                   | https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-8-description                           | This control checks whether Amazon RDS database (DB) instances have automated backups enabled, and verifies that the backup retention period is greater than or equal to seven (7) days.                                                                                                                            |
| CT.RDS.PR.9                   | https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-9-description                           | This control checks whether an Amazon RDS DB cluster is configured to copy all tags to snapshots created.                                                                                                                                                                                                           |
| CT.RDS.PR.10                  | https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-10-description                          | This control checks whether Amazon RDS DB instances are configured to copy all tags to snapshots created.                                                                                                                                                                                                           |
| CT.RDS.PR.11                  | https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-11-description                          | This control checks whether an Amazon RDS database (DB) instance is deployed in a VPC (that is, an EC2 VPC instance).                                                                                                                                                                                               |
| CT.RDS.PR.12                  | https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-12-description                          | This control checks whether your Amazon RDS event subscriptions for RDS clusters are configured to notify on event categories of 'maintenance' and 'failure.'                                                                                                                                                       |
| CT.RDS.PR.13                  | https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-13-description                          | This control checks whether an Amazon Relational Database Service (Amazon RDS) instance has deletion protection activated.                                                                                                                                                                                          |
| CT.RDS.PR.14                  | https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-14-description                          | This rules checks whether Amazon Relational Database Service (RDS) instances have all available log types configured for export to Amazon CloudWatch Logs.                                                                                                                                                          |
| CT.RDS.PR.15                  | https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-15-description                          | This control checks whether any Amazon Relational Database Services (RDS) database (DB) security groups are created by, or associated to, an RDS DB instance, because DB security groups are intended for the EC2-Classic platform only.                                                                            |
| CT.RDS.PR.16                  | https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-16-description                          | This control checks whether the storage encryption is configured on Amazon Relational Database Service (RDS) database (DB) clusters that are not being restored from an existing cluster.                                                                                                                           |
| CT.RDS.PR.17                  | https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-17-description                          | This control checks whether your Amazon RDS event subscriptions for RDS instances are configured to notify on event categories of 'maintenance', 'failure', and 'configuration change'.                                                                                                                             |
| CT.RDS.PR.18                  | https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-18-description                          | This control checks whether your Amazon RDS event subscriptions for RDS parameter groups are configured to notify on event categories of 'configuration change.'                                                                                                                                                    |
| CT.RDS.PR.19                  | https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-19-description                          | This control checks whether your Amazon RDS event subscriptions for RDS security groups are configured to notify on event categories of 'failure' and 'configuration change'                                                                                                                                        |
| CT.RDS.PR.20                  | https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-20-description                          | This control checks whether Amazon Relational Database Service (RDS) database instances are configured for default database port for their specific engine types.                                                                                                                                                   |
| CT.RDS.PR.21                  | https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-21-description                          | This control checks whether an Amazon Relational Database Service (RDS) database (DB) cluster has changed the administrator username from its default value.                                                                                                                                                        |
| CT.RDS.PR.22                  | https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-22-description                          | This control checks whether an Amazon RDS database has changed the adminstrator username from its default value.                                                                                                                                                                                                    |
| CT.RDS.PR.23                  | https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-23-description                          | This rule checks whether Amazon Relational Database Service (RDS) database (DB) instances are publicly accessible, as determined by checking the 'PubliclyAccessible' configuration property.                                                                                                                       |
| CT.RDS.PR.24                  | https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-24-description                          | This control checks whether storage encryption is enabled for your Amazon RDS database (DB) instance.                                                                                                                                                                                                               |
| CT.REDSHIFT.PR.1              | https://docs.aws.amazon.com/controltower/latest/userguide/redshift-rules.html#ct-redshift-pr-1-description                 | This control checks whether Amazon Redshift clusters are configured to not be publicly accessible.                                                                                                                                                                                                                  |
| CT.REDSHIFT.PR.2              | https://docs.aws.amazon.com/controltower/latest/userguide/redshift-rules.html#ct-redshift-pr-2-description                 | This control checks whether Amazon Redshift clusters have automated snapshots enabled, and set with an automated snapshot retention period greater than or equal to seven (7) days.                                                                                                                                 |
| CT.REDSHIFT.PR.3              | https://docs.aws.amazon.com/controltower/latest/userguide/redshift-rules.html#ct-redshift-pr-3-description                 | This control checks whether an Amazon Redshift cluster has audit logging activated.                                                                                                                                                                                                                                 |
| CT.REDSHIFT.PR.4              | https://docs.aws.amazon.com/controltower/latest/userguide/redshift-rules.html#ct-redshift-pr-4-description                 | This control checks whether automatic major version upgrades are enabled for your Amazon Redshift cluster.                                                                                                                                                                                                          |
| CT.REDSHIFT.PR.5              | https://docs.aws.amazon.com/controltower/latest/userguide/redshift-rules.html#ct-redshift-pr-5-description                 | This control checks whether an Amazon Redshift cluster has enhanced VPC routing configured.                                                                                                                                                                                                                         |
| CT.REDSHIFT.PR.6              | https://docs.aws.amazon.com/controltower/latest/userguide/redshift-rules.html#ct-redshift-pr-6-description                 | This control checks whether an Amazon Redshift cluster has changed the administrator username from its default value.                                                                                                                                                                                               |
| CT.REDSHIFT.PR.7              | https://docs.aws.amazon.com/controltower/latest/userguide/redshift-rules.html#ct-redshift-pr-7-description                 | This control checks whether an Amazon Redshift cluster has changed its database name from the default value.                                                                                                                                                                                                        |
| CT.S3.PR.1                    | https://docs.aws.amazon.com/controltower/latest/userguide/s3-rules.html#ct-s3-pr-1-description                             | This control checks whether your Amazon Simple Storage Service (Amazon S3) bucket has a bucket-level Block Public Access (BPA) configuration.                                                                                                                                                                       |
| CT.S3.PR.2                    | https://docs.aws.amazon.com/controltower/latest/userguide/s3-rules.html#ct-s3-pr-2-description                             | This control checks whether server access logging is enabled for your Amazon S3 bucket.                                                                                                                                                                                                                             |
| CT.S3.PR.3                    | https://docs.aws.amazon.com/controltower/latest/userguide/s3-rules.html#ct-s3-pr-3-description                             | This control checks whether your Amazon Simple Storage Service (Amazon S3) version-enabled bucket has a lifecycle policy configured.                                                                                                                                                                                |
| CT.S3.PR.4                    | https://docs.aws.amazon.com/controltower/latest/userguide/s3-rules.html#ct-s3-pr-4-description                             | This control checks whether Amazon S3 events notifications are enabled on your Amazon S3 bucket.                                                                                                                                                                                                                    |
| CT.S3.PR.5                    | https://docs.aws.amazon.com/controltower/latest/userguide/s3-rules.html#ct-s3-pr-5-description                             | This control checks whether your Amazon Simple Storage Service (Amazon S3) bucket allows user permissions through access control lists.                                                                                                                                                                             |
| CT.S3.PR.6                    | https://docs.aws.amazon.com/controltower/latest/userguide/s3-rules.html#ct-s3-pr-6-description                             | This control checks whether a lifecycle rule is configured for Amazon S3 buckets.                                                                                                                                                                                                                                   |
| CT.S3.PR.7                    | https://docs.aws.amazon.com/controltower/latest/userguide/s3-rules.html#ct-s3-pr-7-description                             | This control checks whether default server-side encryption is enabled on your Amazon S3 bucket.                                                                                                                                                                                                                     |
| CT.S3.PR.8                    | https://docs.aws.amazon.com/controltower/latest/userguide/s3-rules.html#ct-s3-pr-8-description                             | This control checks whether Amazon S3 bucket policies require requests to use Secure Socket Layer (SSL).                                                                                                                                                                                                            |
| CT.SQS.PR.1                   | https://docs.aws.amazon.com/controltower/latest/userguide/sqs-rules.html#ct-sqs-pr-1-description                           | This control checks whether an Amazon SQS queue is configured with a dead-letter queue.                                                                                                                                                                                                                             |
| CT.SQS.PR.2                   | https://docs.aws.amazon.com/controltower/latest/userguide/sqs-rules.html#ct-sqs-pr-2-description                           | This control checks whether an Amazon SQS queue is encrypted at rest.                                                                                                                                                                                                                                               |
| CT.WAF-REGIONAL.PR.1          | https://docs.aws.amazon.com/controltower/latest/userguide/waf-regional-rules.html#ct-waf-regional-pr-1-description         | This control checks whether an AWS WAF Classic regional rule contains any conditions.                                                                                                                                                                                                                               |
| CT.WAF-REGIONAL.PR.2          | https://docs.aws.amazon.com/controltower/latest/userguide/waf-regional-rules.html#ct-waf-regional-pr-2-description         | This control checks whether an AWS WAF Classic regional web ACL contains any WAF rules or rule groups.                                                                                                                                                                                                              |
| CT.WAF.PR.1                   | https://docs.aws.amazon.com/controltower/latest/userguide/waf-rules.html#ct-waf-pr-1-description                           | This control checks whether an AWS WAF Classic global rule contains any conditions.                                                                                                                                                                                                                                 |
| CT.WAF.PR.2                   | https://docs.aws.amazon.com/controltower/latest/userguide/waf-rules.html#ct-waf-pr-2-description                           | This control checks whether an AWS WAF Classic global web ACL contains any WAF rules or rule groups.                                                                                                                                                                                                                |
| CT.WAFV2.PR.1                 | https://docs.aws.amazon.com/controltower/latest/userguide/wafv2-rules.html#ct-wafv2-pr-1-description                       | This control checks whether an AWS WAFv2 web ACL contains any WAF rules or WAF rule groups.                                                                                                                                                                                                                         |
| CT.WAFV2.PR.2                 | https://docs.aws.amazon.com/controltower/latest/userguide/wafv2-rules.html#ct-wafv2-pr-2-description                       | This control checks whether AWS WAFV2 rule groups contain rules.                                                                                                                                                                                                                                                    |

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



