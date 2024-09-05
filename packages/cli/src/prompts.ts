/* eslint-disable no-console */
import type { SAFE_ANY } from './typedefs';

import { type ConfirmOptions, cancel, confirm, isCancel } from '@clack/prompts';
import chalk from 'chalk';
import { default as gradientString } from 'gradient-string';

import { DEFAULT_COLORS, INFO_COLOR } from './constants';

export const gradient = gradientString(...DEFAULT_COLORS);

export const shawIntroduce = () => {
  shawGradient('Thank you for using pkg-compose.');
  shawGradient(
    'If you have any issues, please create an issue on ' +
      chalk.underline('https://github.com/shaw996/pkg-compose/issues.'),
  );
  shawLine();
};

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

/**
 * Print gradient string
 * @param message
 */
export const shawGradient = (message: string): void => {
  console.log(gradient(message));
};

/**
 * Mesage
 */
export const shawMessage = (message: string): void => {
  console.log(message);
};

/**
 * Information
 */
export const shawInfo = (message: string): void => {
  console.log(chalk.hex(INFO_COLOR)('● INFO: ') + message);
};

/**
 * Done
 * @param message
 */
export const shawDone = (message: string): void => {
  console.log(chalk.greenBright('✔️ DONE: ') + message);
};

/**
 * Warn
 * @param message
 */
export const shawWarn = (message: string): void => {
  console.log(chalk.yellowBright('▲ WARNING: ') + message);
};

/**
 * Failed
 * @param message
 */
export const shawFail = (message: string): void => {
  console.log(chalk.redBright(`✖️ FAILED: ${message}`));
};

/**
 * New line
 * @param lines
 */
export const shawLine = (lines?: number): void => {
  lines = lines ?? 1;

  for (let i = 0; i < lines; i++) {
    console.log();
  }
};
