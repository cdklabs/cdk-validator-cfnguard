import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { copySync } from 'fs-extra';
import * as j2j from 'json2jsii';
import { exec } from '../../src/utils';

class RuleSetProcessor {
  private readonly cloneDir: string;
  private readonly targetRuleDirectory: string;
  private readonly code: j2j.Code;
  private readonly allRules = new Set();
  constructor() {
    const tmpDir = fs.realpathSync(os.tmpdir());
    this.cloneDir = path.join(tmpDir, 'guard-rules');
    this.targetRuleDirectory = path.join(__dirname, '../../rules/aws-guard-rules-registry');
    fs.mkdirSync(this.targetRuleDirectory, { recursive: true });
    this.code = new j2j.Code();
  }

  private normalizeMethodName(name: string): string {
    return name.replace(/-/g, '_').toUpperCase();
  }

  /**
    * Process the mapping files, copy the rules, and codegen the `RuleSet` class
    * Looks something like this where there is a static method per rule set
    *
    * class RuleSet {
    *   public static ABS_CCIGV2_MATERIAL(): RuleSet {
    *     return new RuleSet([
    *      'cloudtrail/cloud_trail_cloud_watch_logs_enabled.guard',
    *      'cloudtrail/cloudtrail_s3_dataevents_enabled.guard',
    *      'cloudwatch/cloudwatch_alarm_action_check.guard',
    *     ]);
    *   }
    * }
    */
  public processMappings() {
    this.cloneRepo();
    const mappingDir = path.join(this.cloneDir, 'mappings');
    const files = fs.readdirSync(mappingDir, { withFileTypes: true });
    this.code.line('/**');
    this.code.line(' * Managed rule sets from the CloudFormation Guard Rules Registry');
    this.code.line(' *');
    this.code.line(' * @see https://github.com/aws-cloudformation/aws-guard-rules-registry');
    this.code.line(' *');
    this.code.line(' */');
    this.code.openBlock('export class RuleSet');
    files.forEach(file => {
      const filePath = path.join(mappingDir, file.name);
      if (file.isFile() && file.name.startsWith('rule_set') && path.extname(file.name) === '.json') {
        const mappingFile: RuleMapping = JSON.parse(fs.readFileSync(filePath).toString('utf-8').trim());
        this.code.line('/**');
        this.code.line(` * ${mappingFile.description}`);
        this.code.line(' *');
        this.code.line(` * Version: ${mappingFile.version}`);
        this.code.line(` * Owner: ${mappingFile.owner}`);
        this.code.line(' *');
        this.code.line(' * @see https://github.com/aws-cloudformation/aws-guard-rules-registry/blob/main/README.md#managed-rule-sets');
        this.code.line(' *');
        this.code.line(' */');
        this.code.openBlock(`public static ${this.normalizeMethodName(mappingFile.ruleSetName)}(): RuleSet`);
        this.code.line('return new RuleSet([');
        this.renderRuleSetBlock(mappingFile);
        this.code.line(']);');
        this.code.closeBlock();
      }
    });
    this.code.line('/**');
    this.code.line(' * Rules from all managed rule sets');
    this.code.line(' *');
    this.code.line(' * @see https://github.com/aws-cloudformation/aws-guard-rules-registry/blob/main/README.md#managed-rule-sets');
    this.code.line(' *');
    this.code.line(' */');
    this.code.openBlock('public static ALL(): RuleSet');
    this.code.line('return new RuleSet([');
    Array.from(this.allRules).forEach(rule => this.code.line(`  '${rule}',`));
    this.code.line(']);');
    this.code.closeBlock();
    this.code.line();

    this.code.line('constructor(public readonly rules: string[]) {}');
    this.code.closeBlock();
    this.renderAndWriteTypeFile();
  }

  private renderAndWriteTypeFile(): void {
    const renderedCode = this.code.render();
    const renderedCodeFileName = path.join(__dirname, '../../src/types.gen.ts');
    fs.rmSync(renderedCodeFileName);
    fs.writeFileSync(renderedCodeFileName, renderedCode);
  }

  private renderRuleSetBlock(mappingFile: RuleMapping) {
    mappingFile.mappings.forEach(mapping => {
      const fullPath = path.join(this.cloneDir, mapping.guardFilePath);
      const parsedPath = path.parse(mapping.guardFilePath);
      if (this.isValidRule(fullPath)) {
        const rulePath = path.join(path.basename(parsedPath.dir), parsedPath.base);
        this.allRules.add(rulePath);
        this.copyRule(fullPath, rulePath);
        this.code.line(`  '${rulePath}',`);
      }
    });
  }

  /**
   * Clone a repo
   */
  private cloneRepo() {
    fs.rmSync(this.cloneDir, { recursive: true, force: true });
    exec([
      'git',
      'clone',
      'https://github.com/aws-cloudformation/aws-guard-rules-registry.git',
      'guard-rules',
    ], { cwd: path.join(this.cloneDir, '..') });
  }

  /**
   * Copy a rule file from the guard rules repo to this repo
   */
  private copyRule(source: string, target: string) {
    const rulesDir = path.join(
      this.targetRuleDirectory,
      path.basename(path.dirname(source)),
    );
    fs.mkdirSync(rulesDir, { recursive: true });
    copySync(
      path.join(source),
      path.join(rulesDir, path.basename(target)),
    );
  }

  /**
   * In the past invalid rules have been committed to
   * the repo which causes errors when guard executes
   */
  private isValidRule(filePath: string): boolean {
    if (EXCLUDE_RULES.includes(path.basename(filePath))) {
      return false;
    }
    try {
      const contents = fs.readFileSync(filePath).toString('utf-8');
      return contents.split(os.EOL).length > 5;

    } catch {
      return false;
    }
  }
}

/**
 * Extra rules to exclude from bundling. There could
 * be things wrong in the rule syntax
 */
const EXCLUDE_RULES = [
  'alb_http_to_https_redirection_check.guard',
];

/**
 * Structure of a rule mapping file
 */
interface RuleMapping {
  /**
   * The owner of the rule, i.e. aws
   */
  owner: string;

  /**
   * The name of the rule set
   */
  ruleSetName: string;

  /**
   * The version of the rule set
   */
  version: string;

  /**
   * The description of the ruleset
   */
  description: string;

  /**
   * A list of controls and their associated rules
   */
  mappings: ControlsMapping[];
}

interface ControlsMapping {
  /**
   * The path to the guard rule that applies to the list of controls
   */
  guardFilePath: string;

  /**
   * A list of security controls that are addressed by
   * the guard rule
   */
  controls: string[];
}


async function main() {
  const processor = new RuleSetProcessor();
  processor.processMappings();
}

main().catch(e => {
  console.log(e);
});
