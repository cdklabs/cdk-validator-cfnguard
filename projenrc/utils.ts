import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Octokit } from '@octokit/rest';
import { RequestHeaders, Endpoints } from '@octokit/types';
export interface IOcto {
}
export type Release = Endpoints['GET /repos/{owner}/{repo}/releases/{release_id}']['response'];
export type ReleaseAsset = Endpoints['GET /repos/{owner}/{repo}/releases/latest']['response']['data']['assets'][0];


export class Octo {
  public readonly octokit: Octokit;
  public readonly headers: RequestHeaders;
  constructor(public readonly owner: string, public readonly repo: string) {
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN needs to be set');
    }
    this.octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    this.headers = {
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }
  public getReleaseId(type: 'guard' | 'rules'): number | undefined {
    const filePath = path.join(__dirname, type === 'guard' ? '../guard-version.json' : '../guard-rules-version.json');
    if (fs.existsSync(filePath)) {
      const guardVersion = fs.readFileSync(filePath).toString('utf-8').trim();
      return JSON.parse(guardVersion).release_id;
    }
    return;
  }

  /**
 * Query GitHub for the latest release
 */
  public async queryLatestRelease(): Promise<Release> {
    const release = await this.octokit.request('GET /repos/{owner}/{repo}/releases/latest', {
      owner: this.owner,
      repo: this.repo,
      headers: this.headers,
    });

    return release;
  }

  public async getRelease(type: 'guard' | 'rules'): Promise<Release> {
    const version = this.getReleaseId(type);
    if (!version) {
      throw new Error("Guard version file does not exist. Run 'yarn update-guard'");
    }
    const release = await this.octokit.repos.getRelease({
      owner: this.owner,
      repo: this.repo,
      headers: this.headers,
      release_id: version,
    });
    return release;
  }

  /**
 * Download a GitHub release asset
 */
  public async downloadReleaseAsset(asset: ReleaseAsset): Promise<string | undefined> {
    const tmpDir = fs.realpathSync(os.tmpdir());
    const tarPath = path.join(tmpDir, asset.name);
    const res = await this.octokit.repos.getReleaseAsset({
      asset_id: asset.id,
      owner: this.owner,
      repo: this.repo,
      headers: {
        ...this.headers,
        accept: 'application/octet-stream',
      },
    });
    fs.appendFileSync(tarPath, Buffer.from(res.data as unknown as ArrayBuffer));
    return tarPath;
  }
}
