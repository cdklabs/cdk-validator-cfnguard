import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Octo, ReleaseAsset } from './utils';


/**
 * Download a GitHub release asset
 */
async function getReleaseAsset(octo: Octo, asset: ReleaseAsset): Promise<string | undefined> {
  const platform = getPlatform(asset.name);
  if (['ubuntu', 'macos'].includes(platform)) {
    return octo.downloadReleaseAsset(asset);
  }
  return;
}

/**
 * Get the latest release of cfn-guard from GitHub
 * and bundle it in the repo.
 */
export async function main() {
  const octo = new Octo('aws-cloudformation', 'cloudformation-guard');
  const release = await octo.getRelease('guard');
  if (!fs.existsSync(path.join(__dirname, '..', 'bin'))) {
    for (const asset of release.data.assets) {
      const platform = getPlatform(asset.name);
      const downloadPath = await getReleaseAsset(octo, asset);
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
