import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { copySync } from 'fs-extra';
import * as j2j from 'json2jsii';
import { exec } from '../../src/utils';
import { Octo } from '../utils';

const EXCLUDE_RULES = [
  'alb_http_to_https_redirection_check.guard',
];

interface RuleMapping {
  owner: string;
  ruleSetName: string;
  version: string;
  description: string;
  mappings: Mapping[];
}
interface Mapping {
  guardFilePath: string;
  controls: string[];
}

/**
 * Clone and checkout a specific version
 */
function cloneVersion(): string | undefined {
  const tmpDir = fs.realpathSync(os.tmpdir());
  const rulesDir = path.join(tmpDir, 'guard-rules');
  fs.rmSync(rulesDir, { recursive: true, force: true });
  exec([
    'git',
    'clone',
    'https://github.com/aws-cloudformation/aws-guard-rules-registry.git',
    'guard-rules',
  ], {
    cwd: tmpDir,
  });
  return rulesDir;
}

function copyRule(source: string, target: string) {
  fs.mkdirSync(path.join(__dirname, '../../rules/aws-guard-rules-registry'), { recursive: true });
  const rulesDir = path.join(
    __dirname,
    '../../rules/aws-guard-rules-registry',
    path.basename(path.dirname(source)),
  );
  fs.mkdirSync(rulesDir, { recursive: true });
  copySync(
    path.join(source),
    path.join(rulesDir, path.basename(target)),
  );
}


function isValidRule(filePath: string): boolean {
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

function processMappings(dir: string) {
  const mappingDir = path.join(dir, 'mappings');
  const files = fs.readdirSync(mappingDir, { withFileTypes: true });
  let allRules = new Set();
  const code = new j2j.Code();
  code.line('/**');
  code.line(' * Managed rule sets from the CloudFormation Guard Rules Registry');
  code.line(' *');
  code.line(' * @see https://github.com/aws-cloudformation/aws-guard-rules-registry');
  code.line(' *');
  code.line(' */');
  code.openBlock('export class RuleSet');
  files.forEach(file => {
    if (file.isFile() && file.name.startsWith('rule_set') && path.extname(file.name) === '.json') {
      const mappingFile: RuleMapping = JSON.parse(fs.readFileSync(path.join(mappingDir, file.name)).toString('utf-8').trim());
      code.line('/**');
      code.line(` * ${mappingFile.description}`);
      code.line(' *');
      code.line(` * Version: ${mappingFile.version}`);
      code.line(` * Owner: ${mappingFile.owner}`);
      code.line(' *');
      code.line(' * @see https://github.com/aws-cloudformation/aws-guard-rules-registry/blob/main/README.md#managed-rule-sets');
      code.line(' *');
      code.line(' */');
      code.openBlock(`public static ${mappingFile.ruleSetName.replace(/-/g, '_').toUpperCase()}(): RuleSet`);
      code.line('return new RuleSet([');
      mappingFile.mappings.forEach(mapping => {
        const parsedPath = path.parse(mapping.guardFilePath);
        if (isValidRule(path.join(dir, mapping.guardFilePath))) {
          const rulePath = path.join(path.basename(parsedPath.dir), parsedPath.base);
          allRules.add(rulePath);
          copyRule(path.join(dir, mapping.guardFilePath), rulePath);
          code.line(`  '${rulePath}',`);
        }
      });
      code.line(']);');
      code.closeBlock();
    }
  });
  code.line('/**');
  code.line(' * Rules from all managed rule sets');
  code.line(' *');
  code.line(' * @see https://github.com/aws-cloudformation/aws-guard-rules-registry/blob/main/README.md#managed-rule-sets');
  code.line(' *');
  code.line(' */');
  code.openBlock('public static ALL(): RuleSet');
  code.line('return new RuleSet([');
  Array.from(allRules).forEach(rule => code.line(`  '${rule}',`));
  code.line(']);');
  code.closeBlock();
  code.line();

  code.line('constructor(public readonly rules: string[]) {}');
  code.closeBlock();
  const renderedCode = code.render();
  const renderedCodeFileName = path.join(__dirname, '../../src/types.gen.ts');
  fs.rmSync(renderedCodeFileName);
  fs.writeFileSync(renderedCodeFileName, renderedCode);
}

async function main() {
  const dir = cloneVersion();
  if (dir) {
    processMappings(dir);
  }
}

main().catch(e => {
  console.log(e);
});
