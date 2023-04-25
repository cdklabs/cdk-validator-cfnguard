import * as fs from 'fs';
import * as path from 'path';
import { join } from 'path';
import {
  App,
  Stack,
} from 'aws-cdk-lib';
import {
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { DatabaseCluster, DatabaseClusterEngine } from 'aws-cdk-lib/aws-rds';
import { CfnGuardValidator } from '../../../../src';
import { GUARD_RULE_VALIDATION_FAILED_MESSAGE_PATTERN } from '../../../constants';

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => { });
  jest.spyOn(console, 'log').mockImplementation(() => { });
});

const GUARD_RULE_CHECK_NAME = 'rds_cluster_storage_encrypted_check';
const GUARD_RULE_PATH = join(__dirname, '../../../../rules/control-tower/cfn-guard/rds/ct-rds-pr-16.guard');
const VALIDATOR_CONFIG = { rules: [GUARD_RULE_PATH], controlTowerRulesEnabled: false };

describe('CT.RDS.PR.16', () => {
  test('Scenario 5a validation succeeds', () => {
    // GIVEN
    const app = new App({
      policyValidationBeta1: [
        new CfnGuardValidator(VALIDATOR_CONFIG),
      ],
      context: {
        '@aws-cdk/core:validationReportJson': true,
      },
    });

    // WHEN
    const stack = new Stack(app, 'Stack');
    new DatabaseCluster(stack, 'DbCluster', {
      engine: DatabaseClusterEngine.AURORA,
      instanceProps: { vpc: new Vpc(stack, 'Vpc') },
      storageEncrypted: true,
    });

    // THEN
    expect(() => {
      app.synth();
    }).not.toThrow();

    const report = JSON.parse(fs.readFileSync(path.join(app.outdir, 'policy-validation-report.json')).toString('utf-8').trim());
    const rules = report.pluginReports.flatMap((r: any) => r.violations.flatMap((v: any) => v.ruleName));
    expect(rules).not.toContain(
      GUARD_RULE_CHECK_NAME,
    );
  });

  test('Scenario 4a validation fails', () => {
    // GIVEN
    const app = new App({
      policyValidationBeta1: [
        new CfnGuardValidator(VALIDATOR_CONFIG),
      ],
      context: {
        '@aws-cdk/core:validationReportJson': true,
      },
    });

    // WHEN
    const stack = new Stack(app, 'Stack');
    new DatabaseCluster(stack, 'DbCluster', {
      engine: DatabaseClusterEngine.AURORA,
      instanceProps: { vpc: new Vpc(stack, 'Vpc') },
      storageEncrypted: false,
    });

    // THEN
    expect(() => {
      app.synth();
    }).toThrow(GUARD_RULE_VALIDATION_FAILED_MESSAGE_PATTERN);

    const report = JSON.parse(fs.readFileSync(path.join(app.outdir, 'policy-validation-report.json')).toString('utf-8').trim());
    const rules = report.pluginReports.flatMap((r: any) => r.violations.flatMap((v: any) => v.ruleName));
    expect(rules).toContain(
      GUARD_RULE_CHECK_NAME,
    );
  });
});