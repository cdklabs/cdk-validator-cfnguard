import * as path from 'path';
import { CdklabsJsiiProject } from 'cdklabs-projen-project-types';
import { JsonPatch, TextFile } from 'projen';
import { NpmAccess } from 'projen/lib/javascript';
import { BundleGuard } from './projenrc';
const project = new CdklabsJsiiProject({
  private: false,
  author: 'AWS',
  authorAddress: 'aws-cdk-dev@amazon.com',
  defaultReleaseBranch: 'main',
  minNodeVersion: '16.14.0',
  cdklabsPublishingDefaults: false,
  devDeps: [
    'cdklabs-projen-project-types',
    '@octokit/types',
    '@octokit/rest',
    'mock-fs',
    '@types/mock-fs',
    'constructs',
    'aws-cdk-lib@^2.71.0',
    'jsii@^5.0.0',
    'fs-extra@^11.1.1',
    '@types/fs-extra@11.0.1',
    'klaw@^4.1.0',
    '@types/klaw@3.0.3',
  ],
  name: '@cdklabs/cdk-validator-cfnguard',
  jsiiVersion: '~5.0.0',
  keywords: [
    'cdk',
    'validator',
    'policy as code',
  ],
  githubOptions: {
    mergify: false,
  },
  npmAccess: NpmAccess.PUBLIC,
  enablePRAutoMerge: true,
  projenrcTs: true,
  release: true,
  repositoryUrl: 'https://github.com/cdklabs/cdk-validator-cfnguard.git',
  peerDeps: [
    'aws-cdk-lib@^2.71.0',
  ],
  publishToPypi: {
    distName: 'cdklabs.cdk-validator-cfnguard',
    module: 'cdklabs.cdk_validator_cfnguard',
  },
  publishToMaven: {
    javaPackage: 'io.github.cdklabs.cdkvalidatorcfnguard',
    mavenGroupId: 'io.github.cdklabs',
    mavenArtifactId: 'cdk-validator-cfnguard',
    mavenEndpoint: 'https://s01.oss.sonatype.org',
  },
  publishToNuget: {
    dotNetNamespace: 'Cdklabs.CdkValidatorCfnGuard',
    packageId: 'Cdklabs.CdkValidatorCfnGuard',
  },

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // packageName: undefined,  /* The "name" in package.json. */
});


project.addTask('integ', {
  description: 'Run integration snapshot tests',
  exec: 'npx cdk synth --app "ts-node test/integ.plugin.ts"',
});

const rosettaTask = project.addTask('rosetta:extract', {
  description: 'Test rosetta extract',
  exec: 'yarn --silent jsii-rosetta extract --strict',
});
project.postCompileTask.spawn(rosettaTask);
project.addGitIgnore('.jsii.tabl.json');

new TextFile(project, 'rosetta/default.ts-fixture', {
  lines: [
    '// Fixture with packages imported, but nothing else',
    "import { Construct } from 'constructs';",
    "import { CfnGuardValidator } from './src';",
    'import {',
    '  Stack,',
    '  App,',
    "} from 'aws-cdk-lib';",
    '',
    'class Fixture extends Stack {',
    '  constructor(scope: Construct, id: string) {',
    '    super(scope, id);',
    '',
    '    /// here',
    '  }',
    '}',
  ],
  marker: false,
});

new TextFile(project, '.github/CODEOWNERS', {
  lines: [
    '# global owners',
    '# These owners will be the default owners for everything in',
    '# the repo. Unless a later match takes precedence',
    '# @cdklabs/aws-cdk-team will be requested for',
    '# review when someone opens a pull request.',
    '* @cdklabs/aws-cdk-team',
    '',
    '# CT team owns the policies',
    '/rules/ @cdklabs/cdk-validator-cfnguard',
    '',
    '# allow bot to approve dependency updates',
    'package.json @cdklabs/aws-cdk-team @cdklabs-automation',
    'yarn.lock @cdklabs/aws-cdk-team @cdklabs-automation',
  ],
  marker: false,
});

project.postCompileTask.spawn(rosettaTask);
project.addGitIgnore('.jsii.tabl.json');

project.tryFindObjectFile(path.join(__dirname, './.github/workflows/build.yml'))?.patch(JsonPatch.add('/jobs/build/env/GITHUB_TOKEN', '${{ secrets.GITHUB_TOKEN }}' ));
project.tryFindObjectFile(path.join(__dirname, './.github/workflows/release.yml'))?.patch(JsonPatch.add('/jobs/release/env/GITHUB_TOKEN', '${{ secrets.GITHUB_TOKEN }}' ));
project.tsconfig?.addInclude('projenrc/**/*.ts');
project.gitignore.exclude('bin');
project.gitignore.exclude('cdk.out');
project.gitignore.exclude('test/*.snapshot');
project.gitignore.exclude('test/cdk-integ.out*');

new BundleGuard(project);

project.synth();
