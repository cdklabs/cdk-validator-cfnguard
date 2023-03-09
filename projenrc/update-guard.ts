import * as fs from 'fs';
import * as path from 'path';
import { Endpoints } from '@octokit/types';
import { getOctokit, getReleaseId } from './utils';

type Release = Endpoints['GET /repos/{owner}/{repo}/releases/latest']['response'];

/**
 * Query GitHub for the latest release
 */
async function queryLatestRelease(): Promise<Release> {
  const octokit = getOctokit();
  const release = await octokit.octo.request('GET /repos/{owner}/{repo}/releases/latest', {
    owner: octokit.owner,
    repo: octokit.repo,
    headers: octokit.headers,
  });

  return release;
}
/**
 * Get the latest release of cfn-guard from GitHub
 * and update the guard-version.json file
 */
export async function main() {
  const release = await queryLatestRelease();
  const version = getReleaseId();
  if (!version || release.data.id !== version) {
    fs.writeFileSync(
      path.join(__dirname, '..', 'guard-version.json'),
      JSON.stringify({
        release_id: release.data.id,
        version: release.data.tag_name,
      }, undefined, 2),
      { encoding: 'utf-8' },
    );
  }
}

main().catch(e => {
  console.log(e);
});
