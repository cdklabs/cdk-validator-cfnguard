import { IValidationReport, ValidationReportJson, ValidationReportStatus, ValidationViolationResourceAware } from 'aws-cdk-lib';
import * as plugin from '../src/plugin';


const pluginName = 'cdk-validator-cfnguard';
let execMock: jest.SpyInstance;
let reportMock: IValidationReport;
let addViolationMock = jest.fn().mockImplementation(() => {});
let submitMock = jest.fn().mockImplementation(() => {});
beforeEach(() => {
  execMock = jest.spyOn(plugin, 'exec');
  reportMock = {
    addViolation: addViolationMock,
    submit: submitMock,
    toJson: jest.fn(),
    toString: jest.fn(),
    success: true,
  };
});

afterEach(() => {
  execMock.mockRestore();
});

describe('CfnGuardPlugin', () => {
  test('cfn-guard called', () => {
    const validator = new plugin.CfnGuardValidator();
    validator.validate({
      report: reportMock,
      templatePaths: ['./tmp'],
    });
    expect(submitMock).toHaveBeenCalledWith('cdk-validator-cfnguard');
    expect(execMock).toHaveBeenCalledWith([
      'cfn-guard',
      'validate',
      '--rules',
      '',
      '--data',
      './tmp',
      '--output-format',
      'json',
      '--show-summary',
      'none',
    ]);
  });

  test('test1', () => {
    execMock.mockImplementation(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('./test-data/guard-result1.json');
    });
    const validator = new plugin.CfnGuardValidator();
    validator.validate({
      report: reportMock,
      templatePaths: ['./tmp'],
    });
    expect(submitMock).toHaveBeenCalledWith(pluginName);
    expect(addViolationMock).toHaveBeenCalledWith(
      pluginName,
      {
        fix: '',
        recommendation: '',
        ruleName: '',
        violatingResources: [{
          resourceName: '',
          templatePath: '',
          locations: [''],
        }],
      },
    );
  });
});

