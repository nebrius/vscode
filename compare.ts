/* eslint-disable header/header */
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const ROOT_DIR = import.meta.dirname;

function formatDuration(duration: number) {
  const roundedDuration = Math.round(duration * 10) / 10;
  return `${roundedDuration.toLocaleString().padStart(8, ' ')}ms`;
}

type RuleSet = {
  unused: string;
  cycle: string;
  unresolved: string;
};

async function runLint(
  config: string,
  { unused, cycle, unresolved }: RuleSet
): Promise<RuleSet & { total: string; unusedCount: string; cycleCount: string; unresolvedCount: string }> {
  return new Promise((resolve) => {
    const proc = spawn(
      process.execPath,
      [join(ROOT_DIR, 'node_modules/.bin/eslint'), '-c', config, 'src/**/*'],
      {
        cwd: ROOT_DIR,
        env: {
          TIMING: '1',
          NODE_OPTIONS: '--max-old-space-size=12000'
        },
      }
    );

    let data = '';
    proc.stdout.on('data', (chunk: Buffer) => {
      data += chunk.toString();
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      console.error(chunk.toString());
    });

    proc.on('exit', () => {
      const lines = data.split('\n');
      const unusedEntryRegex = new RegExp(`^\\s*[0-9]*:[0-9]*\\s*error.*${unused}$`);
      const unusedTimeRegex = new RegExp(`^${unused}\\s*\\|\\s*([0-9\\.]*)\\s\\|`);
      const cycleEntryRegex = new RegExp(`^\\s*[0-9]*:[0-9]*\\s*error.*${cycle}$`);
      const cycleTimeRegex = new RegExp(`^${cycle}\\s*\\|\\s*([0-9\\.]*)\\s\\|`);
      const unresolvedEntryRegex = new RegExp(`^\\s*[0-9]*:[0-9]*\\s*error.*${unresolved}$`);
      const unresolvedTimeRegex = new RegExp(
        `^${unresolved}\\s*\\|\\s*([0-9\\.]*)\\s\\|`
      );
      let unusedCount = 0;
      let cycleCount = 0;
      let unresolvedCount = 0;
      let unusedTime: number | undefined;
      let cycleTime: number | undefined;
      let unresolvedTime: number | undefined;
      for (const line of lines) {
        if (unusedEntryRegex.test(line)) {
          unusedCount++;
        }
        const unusedMatch = unusedTimeRegex.exec(line);
        if (unusedMatch) {
          if (unusedTime !== undefined) {
            throw new Error('Unused output already found');
          }
          unusedTime = parseFloat(unusedMatch[1]);
        }
        if (cycleEntryRegex.test(line)) {
          cycleCount++;
        }
        const cycleMatch = cycleTimeRegex.exec(line);
        if (cycleMatch) {
          if (cycleTime !== undefined) {
            throw new Error('Cycle output already found');
          }
          cycleTime = parseFloat(cycleMatch[1]);
        }
        if (unresolvedEntryRegex.test(line)) {
          unresolvedCount++;
        }
        const unresolvedMatch = unresolvedTimeRegex.exec(line);
        if (unresolvedMatch) {
          if (unresolvedTime !== undefined) {
            throw new Error('Unresolved output already found');
          }
          unresolvedTime = parseFloat(unresolvedMatch[1]);
        }
      }
      if (!unusedTime || !cycleTime || !unresolvedTime) {
        throw new Error('Could not find all rule times in output');
      }
      resolve({
        unusedCount: unusedCount.toLocaleString().padStart(10, ' '),
        cycleCount: cycleCount.toLocaleString().padStart(10, ' '),
        unresolvedCount: unresolvedCount.toLocaleString().padStart(10, ' '),
        unused: formatDuration(unusedTime),
        cycle: formatDuration(cycleTime),
        unresolved: formatDuration(unresolvedTime),
        total: formatDuration(unusedTime + cycleTime + unresolvedTime),
      });
    });
  });
}

console.log(`Running Fast Import`);

const fastImportTime = await runLint('eslint.perf.fast-import.config.mjs', {
  unused: 'import-integrity/no-unused-exports',
  cycle: 'import-integrity/no-cycle',
  unresolved: 'import-integrity/no-unresolved-imports',
});

console.log(`Running Import`);
const importTime = await runLint('eslint.perf.import.config.mjs', {
  unused: 'import/no-unused-modules',
  cycle: 'import/no-cycle',
  unresolved: 'import/no-unresolved',
});

console.log(`Running Import X`);
const importXTime = await runLint('eslint.perf.import-x.config.mjs', {
  unused: 'import-x/no-unused-modules',
  cycle: 'import-x/no-cycle',
  unresolved: 'import-x/no-unresolved',
});



console.log(`
            | Unused     | Cycle      | Unresolved |
------------|------------|------------|------------|
Fast Import | ${fastImportTime.unusedCount} | ${fastImportTime.cycleCount} | ${fastImportTime.unresolvedCount} |
Import      | ${importTime.unusedCount} | ${importTime.cycleCount} | ${importTime.unresolvedCount} |
Import X    | ${importXTime.unusedCount} | ${importXTime.cycleCount} | ${importXTime.unresolvedCount} |`);


console.log(`
            | Unused     | Cycle      | Unresolved | Total      |
------------|------------|------------|------------|------------|
Fast Import | ${fastImportTime.unused} | ${fastImportTime.cycle} | ${fastImportTime.unresolved} | ${fastImportTime.total} |
Import      | ${importTime.unused} | ${importTime.cycle} | ${importTime.unresolved} | ${importTime.total} |
Import X    | ${importXTime.unused} | ${importXTime.cycle} | ${importXTime.unresolved} | ${importXTime.total} |`);
