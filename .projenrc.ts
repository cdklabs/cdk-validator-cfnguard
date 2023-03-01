import { CdklabsJsiiProject } from "cdklabs-projen-project-types";
const project = new CdklabsJsiiProject({
  author: "AWS",
  authorAddress: "aws-cdk-dev@amazon.com",
  defaultReleaseBranch: "main",
  devDeps: ["cdklabs-projen-project-types"],
  name: "cdk-validator-cfnguard",
  projenrcTs: true,
  release: false,
  repositoryUrl: "https://github.com/cdklabs/cdk-validator-cfnguard.git",

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();