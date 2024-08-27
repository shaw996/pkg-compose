import { exec } from 'node:child_process';

import chalk from 'chalk';
import ora from 'ora';

import { error, gradient } from './logger';

export function getCommandDescAndLog(log: string, desc: string): string {
  gradient(log);

  return desc;
}

export async function oraExecCmd(cmd: string, hint?: string) {
  hint = hint ?? `Executing ${cmd}`;

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
      interval: 150,
    },
  });

  spinner.start();

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
}
