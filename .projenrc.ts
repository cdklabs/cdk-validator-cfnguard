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
    'fs-extra',
    '@types/fs-extra',
    'mock-fs',
    'json2jsii',
    '@types/mock-fs',
    'constructs',
  ],
  name: 'cdk-validator-cfnguard',
  projenrcTs: true,
  release: false,
  repositoryUrl: 'https://github.com/cdklabs/cdk-validator-cfnguard.git',
  deps: [
    'aws-cdk-lib',
  ],
  peerDeps: [
    'aws-cdk-lib',
  ],

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // packageName: undefined,  /* The "name" in package.json. */
});

project.tsconfig?.addInclude('projenrc/**/*.ts');
project.gitignore.exclude('bin');
project.gitignore.exclude('src/types.gen.ts');
project.gitignore.exclude('cdk.out');
project.gitignore.exclude('test/*.snapshot');
project.gitignore.exclude('test/cdk-integ.out*');

new BundleGuard(project);
const bundleTask = project.addTask('bundle-rules', {
  exec: 'ts-node projenrc/rules/bundle-rules.ts',
});
project.compileTask.prependSpawn(bundleTask);

project.synth();
