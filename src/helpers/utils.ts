import { exec } from 'node:child_process';

import chalk from 'chalk';
import ora, { type Ora } from 'ora';

import { error, gradient } from './logger';

/**
 * Prints log and return desc
 * @param log
 * @param desc
 * @returns
 */
export const getCommandDescAndLog = (log: string, desc: string): string => {
  gradient(log);

  return desc;
};

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

/**
 * Execute command friendly
 * @param cmd
 * @param hint
 * @returns
 */
export const execCmd = async (cmd: string, hint?: string) => {
  hint = hint ?? `Executing ${cmd}`;

  const spinner = createOraSpinner(hint);
  const result = await new Promise((resolve) => {
    exec(cmd, (err, stdout) => {
      if (err) {
        error(`Exec cmd ${cmd} error`);
        process.exit(1);
      }

      resolve(stdout.trim());
    });
  });

  spinner.stop();

  return result as string;
};
