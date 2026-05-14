/* eslint-disable header/header */
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';

const ROOT_DIR = import.meta.dirname;
const RUNS_PER_CONFIG = 5;
const SKIP_ESLINT = process.env.SKIP_ESLINT === '1';

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

function runOxlintOnce({ config, code }: { config: string; code: string }): Promise<RunResult> {
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

    proc.on('close', (exitCode) => {
      const duration = performance.now() - start;
      // oxlint returns exit code 1 when diagnostics are reported, which is expected.
      if (exitCode !== 0 && exitCode !== 1) {
        return reject(
          new Error(
            `oxlint exited with code ${exitCode} for config ${config}\nstderr:\n${stderr}\nstdout:\n${stdout.slice(0, 2000)}`
          )
        );
      }

      let parsed: { diagnostics?: Array<{ code?: string }> };
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
        if (diag.code === code) {
          count++;
        }
      }
      resolve({ duration, count });
    });
  });
}

async function runOxlint({
  label,
  config,
  code,
}: {
  label: string;
  config: string;
  code: string;
}): Promise<RunResult> {
  const durations: number[] = [];
  const counts: number[] = [];
  for (let i = 0; i < RUNS_PER_CONFIG; i++) {
    const { duration, count } = await runOxlintOnce({ config, code });
    durations.push(duration);
    counts.push(count);
    console.log(
      `  (${new Date().toLocaleTimeString()}) ${label} run ${i + 1}/${RUNS_PER_CONFIG}: ${formatDuration(duration).trim()} (${count} errors)`
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
    duration: median(durations),
    count: minCount
  };
}

function runESLintOnce({ config, ruleId }: { config: string; ruleId: string }): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const proc = spawn(
      join(ROOT_DIR, 'node_modules/.bin/eslint'),
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

    proc.on('close', (code) => {
      const duration = performance.now() - start;
      // eslint returns exit code 1 when diagnostics are reported, which is expected.
      if (code !== 0 && code !== 1) {
        return reject(
          new Error(
            `eslint exited with code ${code} for config ${config}\nstderr:\n${stderr}\nstdout:\n${stdout.slice(0, 2000)}`
          )
        );
      }

      let parsed: Array<{ errorCount?: number, messages: Array<{ ruleId?: string }> }>;
      try {
        parsed = JSON.parse(stdout);
      } catch (err) {
        return reject(
          new Error(
            `Failed to parse eslint JSON output for ${config}: ${(err as Error).message}\nFirst 2kb:\n${stdout.slice(0, 2000)}`
          )
        );
      }

      let count = 0;
      for (const result of parsed) {
        for (const message of result.messages) {
          if (message.ruleId === ruleId) {
            count++;
          }
        }
      }
      resolve({ duration, count });
    });
  });
}

async function runESLint({
  label,
  config,
  ruleId,
}: {
  label: string;
  config: string;
  ruleId: string;
}): Promise<RunResult> {
  const durations: number[] = [];
  const counts: number[] = [];
  for (let i = 0; i < RUNS_PER_CONFIG; i++) {
    const { duration, count } = await runESLintOnce({ config, ruleId });
    durations.push(duration);
    counts.push(count);
    console.log(
      `  (${new Date().toLocaleTimeString()}) ${label} run ${i + 1}/${RUNS_PER_CONFIG}: ${formatDuration(duration).trim()} (${count} errors)`
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
    duration: median(durations),
    count: minCount
  };
}

console.log(`Running Oxlint Baseline (no-debugger)`);
const oxlintBaselineResult = await runOxlint({
  label: 'Baseline',
  config: 'oxlint.perf.baseline.config.ts',
  code: 'eslint(no-debugger)',
});

console.log(`Running Oxlint built-in`);
const oxlintBuiltinResult = await runOxlint({
  label: 'Import',
  config: 'oxlint.perf.import.config.ts',
  code: 'import(no-cycle)',
});

console.log(`Running Fast Import (OxLint)`);
const oxlintFastImportResult = await runOxlint({
  label: 'Fast Import',
  config: 'oxlint.perf.fast-import.config.ts',
  code: 'import-integrity(no-cycle)',
});

if (SKIP_ESLINT) {
  console.log(`
                     | Count      | Time       |
---------------------|------------|------------|
Oxlint builtin       | ${formatCount(oxlintBuiltinResult.count - oxlintBaselineResult.count)} | ${formatDuration(oxlintBuiltinResult.duration - oxlintBaselineResult.duration)} |
Fast import (Oxlint) | ${formatCount(oxlintFastImportResult.count - oxlintBaselineResult.count)} | ${formatDuration(oxlintFastImportResult.duration - oxlintBaselineResult.duration)} |`);
  process.exit(0);
}

console.log(`Running ESLint baseline`);
const eslintBaselineResult = await runESLint({
  label: 'Baseline',
  config: 'eslint.perf.baseline.config.mjs',
  ruleId: 'no-debugger',
});

console.log(`Running Fast Import (ESLint)`);
const eslintFastImportResult = await runESLint({
  label: 'Fast Import',
  config: 'eslint.perf.fast-import.config.mjs',
  ruleId: 'import-integrity/no-cycle',
});

console.log(`Running Import (ESLint)`);
const eslintImportResult = await runESLint({
  label: 'Import',
  config: 'eslint.perf.import.config.mjs',
  ruleId: 'import/no-cycle',
});

console.log(`Running Import X (ESLint)`);
const eslintImportXResult = await runESLint({
  label: 'Import X',
  config: 'eslint.perf.import-x.config.mjs',
  ruleId: 'import-x/no-cycle',
});

console.log(`
                     | Count      | Time       |
---------------------|------------|------------|
Oxlint builtin       | ${formatCount(oxlintBuiltinResult.count)} | ${formatDuration(oxlintBuiltinResult.duration - oxlintBaselineResult.duration)} |
Fast import (Oxlint) | ${formatCount(oxlintFastImportResult.count)} | ${formatDuration(oxlintFastImportResult.duration - oxlintBaselineResult.duration)} |
Fast Import (ESLint) | ${formatCount(eslintFastImportResult.count)} | ${formatDuration(eslintFastImportResult.duration - eslintBaselineResult.duration)} |
Import (ESLint)      | ${formatCount(eslintImportResult.count)} | ${formatDuration(eslintImportResult.duration - eslintBaselineResult.duration)} |
Import X (ESLint)    | ${formatCount(eslintImportXResult.count)} | ${formatDuration(eslintImportXResult.duration - eslintBaselineResult.duration)} |`);
