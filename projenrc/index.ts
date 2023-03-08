import { CdklabsJsiiProject } from 'cdklabs-projen-project-types';
import { Component } from 'projen';
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
          { uses: 'actions/checkout@v3' },
          { run: 'yarn install' },
          { run: this.project.runTaskCommand(updateTask) },

          // create a pull request
          {
            uses: 'peter-evans/create-pull-request@v4',
            with: {
              'token': '${{ secrets.PROJEN_GITHUB_TOKEN }}',
              'title': 'feat: update guard version',
              'commit-message': 'feat: update guard version',
              'branch': 'automation/update-guard',
              'committer': 'GitHub Automation <noreply@github.com>',
              'labels': 'auto-approve',
            },
          },
          // Auto-approve PR
          {
            if: 'steps.create-pr.outputs.pull-request-number != 0',
            uses: 'peter-evans/enable-pull-request-automerge@v2',
            with: {
              'token': '${{ secrets.PROJEN_GITHUB_TOKEN }}',
              'pull-request-number': '${{ steps.create-pr.outputs.pull-request-number }}',
              'merge-method': 'squash',
            },
          },
        ],
      },
    });
  }
}
