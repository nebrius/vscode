/* eslint-disable header/header */
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';

const ROOT_DIR = import.meta.dirname;
const RUNS_PER_CONFIG = 5;

function formatDuration(duration: number) {
  const roundedDuration = Math.round(duration * 10) / 10;
  return `${roundedDuration.toLocaleString().padStart(8, ' ')}ms`;
}

function formatCount(count: number) {
  return count.toLocaleString().padStart(10, ' ');
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

type RunResult = {
  duration: number;
  count: number;
};

function runLintOnce(config: string): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const proc = spawn(
      join(ROOT_DIR, 'node_modules/.bin/oxlint'),
      ['-c', config, '--format', 'json', 'src'],
      {
        cwd: ROOT_DIR,
        env: {
          ...process.env,
          NODE_OPTIONS: '--max-old-space-size=12000',
        },
      }
    );

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on('error', reject);

    proc.on('exit', (code) => {
      const duration = performance.now() - start;
      // oxlint returns exit code 1 when diagnostics are reported, which is expected.
      if (code !== 0 && code !== 1) {
        return reject(
          new Error(
            `oxlint exited with code ${code} for config ${config}\nstderr:\n${stderr}\nstdout:\n${stdout.slice(0, 2000)}`
          )
        );
      }

      let parsed: { diagnostics?: Array<{ severity?: string }> };
      try {
        parsed = JSON.parse(stdout);
      } catch (err) {
        return reject(
          new Error(
            `Failed to parse oxlint JSON output for ${config}: ${(err as Error).message}\nFirst 2kb:\n${stdout.slice(0, 2000)}`
          )
        );
      }

      const diagnostics = parsed.diagnostics ?? [];
      let count = 0;
      for (const diag of diagnostics) {
        if (diag.severity === 'error') {
          count++;
        }
      }
      resolve({ duration, count });
    });
  });
}

type AggregateResult = {
  durations: number[];
  median: number;
  counts: number[];
  minCount: number;
  maxCount: number;
};

async function runLint(
  label: string,
  config: string
): Promise<AggregateResult> {
  const durations: number[] = [];
  const counts: number[] = [];
  for (let i = 0; i < RUNS_PER_CONFIG; i++) {
    const { duration, count } = await runLintOnce(config);
    durations.push(duration);
    counts.push(count);
    console.log(
      `  ${label} run ${i + 1}/${RUNS_PER_CONFIG}: ${formatDuration(duration).trim()} (${count} errors)`
    );
  }
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);
  if (minCount !== maxCount) {
    console.warn(
      `  ${label}: non-deterministic error count across runs (range ${minCount}-${maxCount})`
    );
  }
  return {
    durations,
    median: median(durations),
    counts,
    minCount,
    maxCount,
  };
}

console.log(`Running Baseline (no-debugger)`);
const baselineResult = await runLint(
  'Baseline',
  'oxlint.perf.baseline.config.ts'
);

console.log(`Running Import`);
const importResult = await runLint(
  'Import',
  'oxlint.perf.import.config.ts'
);

console.log(`Running Fast Import`);
const fastImportResult = await runLint(
  'Fast Import',
  'oxlint.perf.fast-import.config.ts'
);

function formatCountRange(result: AggregateResult) {
  if (result.minCount === result.maxCount) {
    return formatCount(result.minCount);
  }
  return `${result.minCount.toLocaleString()}–${result.maxCount.toLocaleString()}`.padStart(10, ' ');
}

console.log(`
            | Errors     |
------------|------------|
Baseline    | ${formatCountRange(baselineResult)} |
Import      | ${formatCountRange(importResult)} |
Fast Import | ${formatCountRange(fastImportResult)} |`);

console.log(`
            | Median of ${RUNS_PER_CONFIG} |
------------|--------------|
Baseline    |   ${formatDuration(baselineResult.median)} |
Import      |   ${formatDuration(importResult.median)} |
Fast Import |   ${formatDuration(fastImportResult.median)} |`);

function formatAllDurations(result: AggregateResult) {
  return result.durations.map((d) => formatDuration(d)).join(' | ');
}

console.log(`
All ${RUNS_PER_CONFIG} runs (wall-clock):
Baseline    | ${formatAllDurations(baselineResult)}
Import      | ${formatAllDurations(importResult)}
Fast Import | ${formatAllDurations(fastImportResult)}`);
