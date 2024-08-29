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
        `⠋  ${chalk.gray(`${hint}.`)}`,
        `⠙  ${chalk.gray(`${hint}..`)}`,
        `⠹  ${chalk.gray(`${hint}...`)}`,
        `⠸  ${chalk.gray(`${hint}.`)}`,
        `⠼  ${chalk.gray(`${hint}..`)}`,
        `⠴  ${chalk.gray(`${hint}...`)}`,
        `⠦  ${chalk.gray(`${hint}.`)}`,
        `⠧  ${chalk.gray(`${hint}..`)}`,
        `⠇  ${chalk.gray(`${hint}...`)}`,
        `⠏  ${chalk.gray(`${hint}.`)}`,
      ],
      interval: interval,
    },
  });

  spinner.start();

  return spinner;
};

export interface ExecCmdOptions {
  timeout?: number;
  hint?: string;
  success?: () => void;
  fail?: (errMsg: string) => void;
}

/**
 * Execute command friendly
 * @param cmd
 * @param hint
 * @returns
 */
export const execCmd = async (cmd: string, execCmdOptions?: ExecCmdOptions) => {
  let timeout = 500;
  let hint = `Excuting ${cmd}`;
  let success: ExecCmdOptions['success'];
  let fail: ExecCmdOptions['fail'];

  if (execCmdOptions) {
    timeout = execCmdOptions.timeout ?? timeout;
    hint = execCmdOptions.hint ?? hint;
    success = execCmdOptions.success;
    fail = execCmdOptions.fail;
  }

  const spinner = createOraSpinner(hint);
  const result = await new Promise((resolve) => {
    exec(cmd, (err, stdout) => {
      if (err) {
        if (fail) {
          fail(err.message);
        } else {
          error(`Excute ${cmd} failed\n${err.message}`);
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
    spinner.succeed(` Excute ${cmd} successfully`);
  }

  return result as string;
};
