import { CdklabsJsiiProject } from 'cdklabs-projen-project-types';
import { BundleGuard } from './projenrc';
const project = new CdklabsJsiiProject({
  author: 'AWS',
  authorAddress: 'aws-cdk-dev@amazon.com',
  defaultReleaseBranch: 'main',
  devDeps: [
    'cdklabs-projen-project-types',
    '@octokit/types',
    '@octokit/rest',
    'mock-fs',
    '@types/mock-fs',
    'constructs',
    'aws-cdk-lib@^2.71.0',
    'jsii@^5.0.0',
  ],
  name: '@cdklabs/cdk-validator-cfnguard',
  keywords: [
    'cdk',
    'validator',
    'policy as code',
  ],
  projenrcTs: true,
  release: true,
  repositoryUrl: 'https://github.com/cdklabs/cdk-validator-cfnguard.git',
  peerDeps: [
    'aws-cdk-lib@^2.71.0',
  ],

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // packageName: undefined,  /* The "name" in package.json. */
});

project.tsconfig?.addInclude('projenrc/**/*.ts');
project.gitignore.exclude('bin');
project.gitignore.exclude('cdk.out');
project.gitignore.exclude('test/*.snapshot');
project.gitignore.exclude('test/cdk-integ.out*');

new BundleGuard(project);

project.synth();
