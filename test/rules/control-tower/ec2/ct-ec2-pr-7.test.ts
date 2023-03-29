import * as fs from 'fs';
import * as path from 'path';
import { join } from 'path';
import {
  App,
  Size,
  Stack,
} from 'aws-cdk-lib';
import {
  BlockDeviceVolume,
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  MachineImage,
  Volume,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { CfnGuardValidator } from '../../../../src';
import { GUARD_RULE_VALIDATION_FAILED_MESSAGE_PATTERN } from '../../../constants';

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => { });
  jest.spyOn(console, 'log').mockImplementation(() => { });
});

const GUARD_RULE_CHECK_NAME = 'ec2_encrypted_volumes_check';
const GUARD_RULE_PATH = join(__dirname, '../../../../rules/control-tower/ec2/ct-ec2-pr-7.guard');
const VALIDATOR_CONFIG = { rules: [GUARD_RULE_PATH], controlTowerRulesEnabled: false };

describe('CT.EC2.PR.7', () => {
  test('Scenario 7a validation succeeds', () => {
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
    new Instance(stack, 'Ec2Instance', {
      instanceType: InstanceType.of(InstanceClass.A1, InstanceSize.LARGE),
      machineImage: MachineImage.latestAmazonLinux(),
      vpc: new Vpc(stack, 'Vpc'),
      blockDevices: [{
        volume: BlockDeviceVolume.ebs(8, { encrypted: true }),
        deviceName: 'someblockdevice',
      }],
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

  test('Scenario 8 validation succeeds', () => {
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
    new Volume(stack, 'Volume', {
      availabilityZone: 'us-east-1a',
      encrypted: true,
      size: Size.gibibytes(8),
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

  test('Setting encrypted to false fails', () => {
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
    new Instance(stack, 'Ec2Instance', {
      instanceType: InstanceType.of(InstanceClass.A1, InstanceSize.LARGE),
      machineImage: MachineImage.latestAmazonLinux(),
      vpc: new Vpc(stack, 'Vpc'),
      blockDevices: [{
        volume: BlockDeviceVolume.ebs(8, {
          encrypted: false,
        }),
        deviceName: 'someblockdevice',
      }],
    });
    new Volume(stack, 'Volume', {
      availabilityZone: 'us-east-1a',
      encrypted: false,
      size: Size.gibibytes(8),
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