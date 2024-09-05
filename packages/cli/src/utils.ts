import type { SAFE_ANY } from './typedefs';

import { exec } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import asyncRetry from 'async-retry';
import chalk from 'chalk';
import fetch from 'node-fetch-native';
import ora, { type Ora } from 'ora';

import { shawFail, shawMessage } from './prompts';

/**
 * Create ora spinner
 * @param hint
 * @param interval
 * @returns
 */
export const createOraSpinner = (hint?: string, interval?: number): Ora => {
  hint = hint ?? '';
  interval = interval ?? 200;

  const spinner = ora({
    // Open ctrl + c cancel
    discardStdin: false,
    spinner: {
      frames: [
        `⠋ ${chalk.gray(`${hint}.`)}`,
        `⠙ ${chalk.gray(`${hint}..`)}`,
        `⠹ ${chalk.gray(`${hint}...`)}`,
        `⠸ ${chalk.gray(`${hint}.`)}`,
        `⠼ ${chalk.gray(`${hint}..`)}`,
        `⠴ ${chalk.gray(`${hint}...`)}`,
        `⠦ ${chalk.gray(`${hint}.`)}`,
        `⠧ ${chalk.gray(`${hint}..`)}`,
        `⠇ ${chalk.gray(`${hint}...`)}`,
        `⠏ ${chalk.gray(`${hint}.`)}`,
      ],
      interval: interval,
    },
  });

  spinner.start();

  return spinner;
};

export interface RunCmdOptions {
  timeout?: number;
  hint?: string;
  success?: () => void;
  fail?: (errMsg: string) => void;
}

/**
 * Run command friendly
 * @param cmd
 * @param hint
 * @returns
 */
export const runCmd = async (cmd: string, runCmdOptions?: RunCmdOptions) => {
  let timeout = 500;
  let hint = `Running ${cmd}`;
  let success: RunCmdOptions['success'];
  let fail: RunCmdOptions['fail'];

  if (runCmdOptions) {
    timeout = runCmdOptions.timeout ?? timeout;
    hint = runCmdOptions.hint ?? hint;
    success = runCmdOptions.success;
    fail = runCmdOptions.fail;
  }

  const spinner = createOraSpinner(hint);
  const result = await new Promise((resolve) => {
    exec(cmd, (err, stdout) => {
      if (err) {
        if (fail) {
          fail(err.message);
        } else {
          shawFail(`Run "${cmd}" failed\n${err.message}`);
        }
        process.exit(1);
      }

      setTimeout(() => {
        resolve(stdout.trim());
      }, timeout);
    });
  });

  if (success) {
    spinner.stop();
    success();
  } else {
    spinner.succeed(` Run "${cmd}" successfully`);
  }

  return result as string;
};

/**
 * Create a default action which can help us to validate the command
 * @param commandList
 * @param helpCommand
 * @returns
 */
export const createDefaultAction = (commandList: string[], helpCommand: string) => {
  return async (_: SAFE_ANY, command: SAFE_ANY) => {
    let isArgs = false;

    if (command) {
      const arg = command.args?.[0];

      if (arg && !commandList.includes(arg)) {
        isArgs = true;

        const similaiCommand = matchMostSimilarString(arg, commandList);

        if (similaiCommand) {
          shawFail(`Unknown command '${arg}'. Did you mean '${chalk.underline(similaiCommand)}'?`);
        } else {
          shawFail(`Unknown command '${arg}'`);
        }
      }
    }

    if (!isArgs) {
      const helpInfo = await runCmd(`${helpCommand} --help`);

      shawMessage(helpInfo);
    }

    process.exit(0);
  };
};

/**
 * Record the similar score
 * @param pattern
 * @param text
 * @returns
 */
function calculateSimilarScore(pattern: string, text: string): number {
  // TODO 改为编辑距离算法 -- Levenshtein Distance
  let score = 0;
  const patternLength = pattern.length;
  const textLength = text.length;

  let patternIndex = 0;
  let textIndex = 0;

  while (patternIndex < patternLength && textIndex < textLength) {
    if (pattern[patternIndex] === text[textIndex]) {
      score++;
      textIndex++;
    }

    patternIndex++;
  }

  return score;
}

/**
 * Find the most similar string in a collection
 * @param pattern
 * @param list
 * @returns
 */
export function matchMostSimilarString(pattern: string, list: string[]): string {
  let maxScore = 0;
  let result = '';

  list.forEach((text) => {
    const score = calculateSimilarScore(pattern, text);

    if (score > maxScore) {
      maxScore = score;
      result = text!;
    }
  });

  return result;
}

/**
 * Fetch file
 * @param url File url
 * @returns
 */
export const fetchFile = async (url: string): Promise<Response> => {
  const res = await fetch(url);

  if (!res.body) {
    throw new Error(`Failed to fetch: ${url}`);
  }

  return res;
};

/**
 * Fetch file stream
 * @param url File url
 * @returns
 */
const fetchFileStream = async (url: string) => {
  const res = await fetchFile(url);

  return Readable.fromWeb(res.body!);
};

const createFileIfNotExisted = async (filepath: string) => {
  const dir = dirname(filepath);

  if (existsSync(dir)) {
    return;
  }

  mkdirSync(dir, { recursive: true });
};

/**
 * Download remote file
 * @param dir Directory
 * @param url File url
 * @param retries Retry times
 */
export const downloadFile = async (filepath: string, url: string, retries?: number) => {
  const filename = basename(url);
  const spinner = createOraSpinner(`Downloading ${filename}`);

  await asyncRetry(
    async (bail) => {
      await createFileIfNotExisted(resolve(process.cwd(), filepath));

      try {
        await pipeline(await fetchFileStream(url), createWriteStream(filepath));
        spinner.stop();
      } catch (err: SAFE_ANY) {
        spinner.stop();
        bail(new Error(err.message));
      }
    },
    {
      retries: retries ?? 5,
    },
  ).finally(() => {
    spinner.stop();
  });
};
