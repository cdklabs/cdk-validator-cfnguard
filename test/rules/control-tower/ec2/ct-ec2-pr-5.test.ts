import * as fs from 'fs';
import * as path from 'path';
import { join } from 'path';
import {
  App,
  CfnResource,
  Stack,
} from 'aws-cdk-lib';
import { AclCidr, AclTraffic, NetworkAcl, NetworkAclEntry, Vpc } from 'aws-cdk-lib/aws-ec2';
import { CfnGuardValidator } from '../../../../src';
import { GUARD_RULE_VALIDATION_FAILED_MESSAGE_PATTERN } from '../../../constants';

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => { });
  jest.spyOn(console, 'log').mockImplementation(() => { });
});

const GUARD_RULE_CHECK_NAME = 'nacl_no_unrestricted_ssh_rdp_check';
const GUARD_RULE_PATH = join(__dirname, '../../../../rules/control-tower/cfn-guard/ec2/ct-ec2-pr-5.guard');
const VALIDATOR_CONFIG = { rules: [GUARD_RULE_PATH], controlTowerRulesEnabled: false };

describe('CT.EC2.PR.5', () => {
  test('Scenario 2 validation succeeds', () => {
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
    const nacl = new NetworkAcl(stack, 'Nacl', { vpc: new Vpc(stack, 'VPC') });
    new NetworkAclEntry(stack, 'NaclEntry', {
      networkAcl: nacl,
      cidr: AclCidr.ipv4('176.16.0.0/24'),
      ruleNumber: 1,
      traffic: AclTraffic.tcpPort(22),
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

  test('Scenario 5c validation fails', () => {
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
    const nacl = new NetworkAcl(stack, 'Nacl', { vpc: new Vpc(stack, 'VPC') });
    new NetworkAclEntry(stack, 'NaclEntry', {
      networkAcl: nacl,
      cidr: AclCidr.anyIpv4(),
      ruleNumber: 1,
      traffic: AclTraffic.udpPortRange(3000, 3500),
    });

    // THEN
    app.synth();
    expect(process.exitCode).toEqual(1);
    const report = JSON.parse(fs.readFileSync(path.join(app.outdir, 'policy-validation-report.json')).toString('utf-8').trim());
    const rules = report.pluginReports.flatMap((r: any) => r.violations.flatMap((v: any) => v.ruleName));
    expect(rules).toContain(
      GUARD_RULE_CHECK_NAME,
    );
  });


  test('Scenario 7d validation succeeds', () => {
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
    const nacl = new NetworkAcl(stack, 'Nacl', { vpc: new Vpc(stack, 'VPC') });
    new NetworkAclEntry(stack, 'NaclEntry', {
      networkAcl: nacl,
      cidr: AclCidr.anyIpv6(),
      ruleNumber: 1,
      traffic: AclTraffic.tcpPortRange(100, 200),
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

  test.only('String port ranges fail', () => {
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
    new CfnResource(stack, 'NaclEntry', {
      type: 'AWS::EC2::NetworkAclEntry',
      properties: {
        CidrBlock: '0.0.0.0/0',
        Protocol: 6,
        PortRange: {
          From: '100',
          To: '200',
        },
        RuleAction: 'allow',
        RuleNumber: 1,
      },
    });

    // THEN
    app.synth();
    expect(process.exitCode).toEqual(1);

    const report = JSON.parse(fs.readFileSync(path.join(app.outdir, 'policy-validation-report.json')).toString('utf-8').trim());
    const rules = report.pluginReports.flatMap((r: any) => r.violations.flatMap((v: any) => v.ruleName));
    expect(rules).toContain(
      GUARD_RULE_CHECK_NAME,
    );
  });
});
