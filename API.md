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

### Bundled Rules

| Control Tower rule ID | Control Tower docs link | Description |
| --------------------- | ----------------------- | ---------------- |
| CT.IAM.PR.2 | [docs](https://docs.aws.amazon.com/controltower/latest/userguide/iam-rules.html#ct-iam-pr-2-description) | This control checks whether AWS Identity and Access Management (IAM) customer managed policies do not include \"Effect\": \"Allow\" with \"Action\": \"\*\" over \"Resource\": \"\*\"." |
| CT.EC2.PR.5 | [docs](https://docs.aws.amazon.com/controltower/latest/userguide/ec2-rules.html#ct-ec2-pr-5-description) | This control checks whether the Amazon EC2 network ACL inbound entry allows unrestricted incoming traffic (0.0.0.0/0 or ::/0) for SSH or RDP. |
| CT.EC2.PR.7 | [docs](https://docs.aws.amazon.com/controltower/latest/userguide/ec2-rules.html#ct-ec2-pr-7-description) | This control checks whether your standalone Amazon EC2 EBS volumes and new Amazon EBS volumes created through EC2 instance Block Device Mappings are encrypted at rest. |
| CT.RDS.PR.16 | [docs](https://docs.aws.amazon.com/controltower/latest/userguide/rds-rules.html#ct-rds-pr-16-description) | This control checks whether the storage encryption is configured on Amazon Relational Database Service (RDS) database (DB) clusters that are not being restored from an existing cluster. |
| CT.S3.PR.1  | [docs](https://docs.aws.amazon.com/controltower/latest/userguide/s3-rules.html#ct-s3-pr-1-description) | This control checks whether your Amazon Simple Storage Service (Amazon S3) bucket has a bucket-level Block Public Access (BPA) configuration. |
| CT.S3.PR.2  | [docs](https://docs.aws.amazon.com/controltower/latest/userguide/s3-rules.html#ct-s3-pr-2-description) | This control checks whether server access logging is enabled for your Amazon S3 bucket. |
| CT.S3.PR.7  | [docs](https://docs.aws.amazon.com/controltower/latest/userguide/s3-rules.html#ct-s3-pr-7-description) | This control checks whether default server-side encryption is enabled on your Amazon S3 bucket. |
| CT.S3.PR.8  | [docs](https://docs.aws.amazon.com/controltower/latest/userguide/s3-rules.html#ct-s3-pr-8-description) | This control checks whether Amazon S3 bucket policies require requests to use Secure Socket Layer (SSL). |

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



