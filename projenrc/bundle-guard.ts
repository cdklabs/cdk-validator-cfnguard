import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getOctokit, getReleaseId, Octo, Release, ReleaseAsset } from './utils';


/**
 * Download a GitHub release asset
 */
async function downloadReleaseAsset(octokit: Octo, asset: ReleaseAsset): Promise<string | undefined> {
  if (getPlatform(asset.name) === 'other') {
    return;
  }
  if (getArchitecture(asset.name) === 'other') {
    return;
  }
  const tmpDir = fs.realpathSync(os.tmpdir());
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
      const architecture = getArchitecture(asset.name);
      const downloadPath = await downloadReleaseAsset(octokit, asset);
      if (downloadPath) {
        spawnSync('tar', ['-xzf', asset.name], {
          cwd: path.join(downloadPath, '..'),
        });
        const directoryPath = path.join(__dirname, '..', 'bin', platform, architecture);
        fs.mkdirSync(directoryPath, { recursive: true });
        fs.copyFileSync(
          path.join(downloadPath, '..', path.basename(asset.name, '.tar.gz'), 'cfn-guard'),
          path.join(directoryPath, 'cfn-guard'),
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

function getArchitecture(name: string): 'x86_64' | 'aarch64' | 'other' {
  if (name.includes('x86_64')) return 'x86_64';
  if (name.includes('aarch64')) return 'aarch64';
  return 'other';
}

main().catch(e => {
  console.log(e);
});
