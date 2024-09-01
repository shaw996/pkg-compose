import type { SAFE_ANY } from '@/helpers/type';

import { type ConfirmOptions, cancel, confirm, isCancel } from '@clack/prompts';
import chalk from 'chalk';

import { log } from '@/helpers/logger';

export const COLOR_INFO = '6d99d3';

/**
 * Print "Operation cancelled" and exit
 * @param value
 */
export const shawCancel = (value: SAFE_ANY) => {
  if (isCancel(value)) {
    cancel(`${chalk.red('✖')} Operation cancelled`);
    process.exit(0);
  }
};

/**
 * Confirm the next operation
 * @param opts
 * @returns
 */
export const shawConfirm = async (opts: ConfirmOptions): ReturnType<typeof confirm> => {
  const isContinue = await confirm(opts);

  shawCancel(isContinue);

  return isContinue;
};

const handleMessage = (message: string): string => {
  return message.replace(/\n/g, `\n${chalk.gray('│  ')}`);
};

/**
 * Print introduce
 * @param message
 */
export const shawIntro = (message: string): void => {
  log(chalk.grey('┌  ') + handleMessage(message));
};

/**
 * End introduce
 * @param message
 */
export const shawOutro = (message: string): void => {
  log(chalk.grey('└  ') + handleMessage(message));
};

/**
 * Display message
 * @param message
 */
export const shawMessage = (message: string): void => {
  log(chalk.gray('│  ') + handleMessage(message));
};

/**
 * Display short info
 */
export const shawInfo = (message: string): void => {
  log(chalk.hex(COLOR_INFO)('●  ') + handleMessage(message));
};

/**
 * Success info
 * @param message
 */
export const shawSuccess = (message: string): void => {
  log(chalk.gray('│  ') + chalk.greenBright(`✔️ ${handleMessage(message)}`));
};

/**
 * Warining info
 * @param message
 */
export const shawWarn = (message: string): void => {
  log(chalk.gray('│  ') + chalk.yellowBright(`▲ ${handleMessage(message)}`));
};

/**
 * Failed info
 * @param message
 */
export const shawFailed = (message: string): void => {
  log(chalk.gray('│  ') + chalk.redBright(`✖️ ${handleMessage(message)}`));
};

/**
 * New line
 * @param message
 */
export const shawNewline = (): void => {
  log(chalk.gray('│'));
};
