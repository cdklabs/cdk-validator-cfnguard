import * as path from 'path';
import { CdklabsJsiiProject } from 'cdklabs-projen-project-types';
import { JsonPatch } from 'projen';
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
  jsiiVersion: '~5.0.0',
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
  publishToGo: {
    moduleName: 'cdk-validator-cfnguard-go',
  },

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // packageName: undefined,  /* The "name" in package.json. */
});

project.tryFindObjectFile(path.join(__dirname, './.github/workflows/build.yml'))?.patch(JsonPatch.add('/jobs/build/env/GITHUB_TOKEN', '${{ secrets.GITHUB_TOKEN }}' ));
project.tsconfig?.addInclude('projenrc/**/*.ts');
project.gitignore.exclude('bin');
project.gitignore.exclude('cdk.out');
project.gitignore.exclude('test/*.snapshot');
project.gitignore.exclude('test/cdk-integ.out*');

new BundleGuard(project);

project.synth();
