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
npm install cdk-validator-cfnguard
```

### Python

```bash
pip install cdk-validator-cfnguard
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
dotnet add package CdklabsCdkValidatorCfnguard --version X.X.X
```

### Go

```bash
go get cdk-validator-cfnguard-go
```

## Usage

To use this plugin in your CDK application add it to the CDK App.

```ts
new App({
  validationPlugins: [
    new CfnGuardValidator(),
  ],
});
```

By default the `CfnGuardValidator` plugin comes with the [Managed Rule Sets](https://github.com/aws-cloudformation/aws-guard-rules-registry/blob/main/README.md#managed-rule-sets)
from the [CloudFormation Rule Registry](https://github.com/aws-cloudformation/aws-guard-rules-registry)
enabled. In order to disable these rules you can use the
`guardRulesRegistryEnabled: false` property.

```ts
new CfnGuardValidator({
  guardRulesRegistryEnabled: false,
});
```

It is also possible to disable individual rules.

```ts
new CfnGuardValidator({
  disabledRules: [
    'iam_no_inline_policy_check',
  ],
});
```

### Rule Sets

By default all managed rules are enabled. This is equivalent to

```ts
new CfnGuardValidator({
  managedRuleSets: [
    RuleSet.ALL(),
  ],
});
```

If you only want to enable some rule sets, you can provide the list to `managedRuleSets`.
For example, if you only want to enable the `CIS AWS Benchmark`

```ts
new CfnGuardValidator({
  managedRuleSets: [
    RuleSet.CIS_AWS_BENCHMARK_LEVEL_1(),
  ],
});
```

Some rules apply across multiple rule sets, but each rule will only be executed
once against a given template. For a full list of Managed Rule Sets check out
the [CloudFormation Guard Rules Registry](https://github.com/aws-cloudformation/aws-guard-rules-registry#managed-rule-sets)

### Additional rules

To provide additional rules to the plugin, provide a list of local
file or directory paths.

```ts
new CfnGuardValidator({
  localRules: [
    path.join(__dirname, 'local-rules'),
    path.join(__dirname, 's3', 'local-rules', 'my-rule.guard'),
  ]
});
```

If the path provided is a directory then the directory must only
contain guard rule files, and all rules within the directory will be used.

