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



