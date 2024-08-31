import type { SAFE_ANY } from './type';

import { exec } from 'node:child_process';

import chalk from 'chalk';
import ora, { type Ora } from 'ora';

import { error, gradient, log } from './logger';
import { matchMostSimilarString } from './matcher';

/**
 * Prints log and return desc
 * @param log
 * @param desc
 * @returns
 */
export const printLogAndReturnDesc = (log: string, desc: string): string => {
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
          error(`Run "${cmd}" failed\n${err.message}`);
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

        const matchCommand = matchMostSimilarString(arg, commandList);

        if (matchCommand) {
          error(`Unknown command '${arg}'. Did you mean '${chalk.underline(matchCommand)}'?`);
        } else {
          error(`Unknown command '${arg}'`);
        }
      }
    }

    if (!isArgs) {
      // If no arguments then run "[command] --help" to display help list
      const helpInfo = await runCmd(`${helpCommand} --help`);

      const helpInfoArr = helpInfo
        .split('\n')
        .map((info) => {
          if (!info || info.includes('Shaw Kit CLI v') || info.startsWith('>')) {
            return null;
          }

          const command = info.match(/(\w+)\s\[/)?.[1];

          if (command) {
            return info.replace(command, chalk.cyan(command));
          }

          return info;
        })
        .filter(Boolean);

      log(helpInfoArr.join('\n'));
    }

    process.exit(0);
  };
};
