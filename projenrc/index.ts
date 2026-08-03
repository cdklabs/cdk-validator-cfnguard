import { CdklabsJsiiProject } from 'cdklabs-projen-project-types';
import { Component } from 'projen';
import { WorkflowActions, WorkflowSteps } from 'projen/lib/github';
import { JobPermission } from 'projen/lib/github/workflows-model';

export class BundleGuard extends Component {
  constructor(project: CdklabsJsiiProject) {
    super(project);
    const updateTask = project.addTask('update-guard', {
      exec: 'ts-node projenrc/update-guard.ts',
    });
    const bundleTask = project.addTask('bundle-guard', {
      exec: 'ts-node projenrc/bundle-guard.ts',
    });
    updateTask.spawn(bundleTask);
    project.defaultTask?.spawn(bundleTask);

    const workflow = project.github?.addWorkflow('update-guard');
    workflow?.on({
      workflowDispatch: {},
      schedule: [{ cron: '0 6 * * MON' }],
    });
    workflow?.addJobs({
      update: {
        permissions: {
          contents: JobPermission.WRITE,
        },
        runsOn: ['ubuntu-latest'],
        steps: [
          WorkflowSteps.checkout(),
          ...project.renderWorkflowSetup({ mutable: true }),
          { run: this.project.runTaskCommand(updateTask) },

          // create a pull request
          ...WorkflowActions.createPullRequest({
            workflowName: 'update-guard',
            pullRequestTitle: 'feat: update guard version',
            pullRequestDescription: 'Updates the bundled cfn-guard version to the latest release.',
            branchName: 'automation/update-guard',
            labels: ['auto-approve'],
            credentials: project.github?.projenCredentials,
          }),
        ],
      },
    });
  }
}
