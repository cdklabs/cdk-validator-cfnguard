import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getOctokit, getReleaseId, Octo, Release, ReleaseAsset } from './utils';


/**
 * Download a GitHub release asset
 */
async function downloadReleaseAsset(octokit: Octo, asset: ReleaseAsset): Promise<string | undefined> {
  const tmpDir = fs.realpathSync(os.tmpdir());
  const platform = getPlatform(asset.name);
  if (['ubuntu', 'macos'].includes(platform)) {
    const tarPath = path.join(tmpDir, asset.name);
    const res = await octokit.octo.repos.getReleaseAsset({
      asset_id: asset.id,
      owner: octokit.owner,
      repo: octokit.repo,
      headers: {
        ...octokit.headers,
        accept: 'application/octet-stream',
      },
    });
    fs.appendFileSync(tarPath, Buffer.from(res.data as unknown as ArrayBuffer));
    return tarPath;
  }
  return;
}

async function getRelease(octokit: Octo): Promise<Release> {
  const version = getReleaseId();
  if (!version) {
    throw new Error("Guard version file does not exist. Run 'yarn update-guard'");
  }
  const release = await octokit.octo.repos.getRelease({
    owner: octokit.owner,
    repo: octokit.repo,
    headers: octokit.headers,
    release_id: version,
  });
  return release;
}

/**
 * Get the latest release of cfn-guard from GitHub
 * and bundle it in the repo.
 */
export async function main() {
  const octokit = getOctokit();
  const release = await getRelease(octokit);
  if (!fs.existsSync(path.join(__dirname, '..', 'bin'))) {
    for (const asset of release.data.assets) {
      const platform = getPlatform(asset.name);
      const downloadPath = await downloadReleaseAsset(octokit, asset);
      if (downloadPath) {
        spawnSync('tar', ['-xzf', asset.name], {
          cwd: path.join(downloadPath, '..'),
        });
        fs.mkdirSync(path.join(__dirname, '../bin', 'macos'), { recursive: true });
        fs.mkdirSync(path.join(__dirname, '../bin', 'ubuntu'), { recursive: true });
        fs.copyFileSync(
          path.join(downloadPath, '..', path.basename(asset.name, '.tar.gz'), 'cfn-guard'),
          path.join(__dirname, '..', 'bin', platform, 'cfn-guard'),
        );
      }
    }
  }
}

function getPlatform(name: string): 'ubuntu' | 'macos' | 'other' {
  if (name.includes('ubuntu')) return 'ubuntu';
  if (name.includes('macos')) return 'macos';
  return 'other';
}

main().catch(e => {
  console.log(e);
});
