import { join } from 'path';
import { pathExists } from 'fs-extra';
import klaw from 'klaw';

describe('Metadata files', () => {
  test('a metadata file exists for each rule file', async () => {
    for await (const ruleFile of klaw(join(__dirname, '../../../rules/control-tower/cfn-guard'))) {
      if (ruleFile.stats.isDirectory()) { continue; }
      const metadataPath = ruleFile.path
        .replace('/control-tower/cfn-guard/', '/control-tower/metadata/')
        .replace('.guard', '.metadata.json');
      console.log(metadataPath);
      expect(await pathExists(metadataPath)).toBe(true);
    }
  });

  test('a guard file exists for each metadata file', async () => {
    for await (const metadataFile of klaw(join(__dirname, '../../../rules/control-tower/metadata'))) {
      if (metadataFile.stats.isDirectory()) { continue; }
      const ruleFilePath = metadataFile.path
        .replace('/control-tower/metadata/', '/control-tower/cfn-guard/')
        .replace('.metadata.json', '.guard');
      console.log(ruleFilePath);
      expect(await pathExists(ruleFilePath)).toBe(true);
    }
  });
});