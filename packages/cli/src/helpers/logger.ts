/* eslint-disable no-console */
import type tinycolor from 'tinycolor2';

import chalk from 'chalk';
import { default as _gradientString } from 'gradient-string';

export const defaultColors = ['#a862ea', '#1b53ff'] as const;

export const gradientString = _gradientString(...defaultColors);

const logPrefix = gradientString('Shaw Kit CLI:');

/**
 * Print commonly
 * @param args
 */
export const log = (...args: Parameters<typeof console.log>) => {
  console.log(...args);
};

/**
 * Print commonly and insert prefix in front
 * @param args
 */
export const logWithPrefix = (...args: Parameters<typeof console.log>) => {
  log(logPrefix, ...args);
};

/**
 * Print error
 * @param args
 */
export const error = (...args: Parameters<typeof console.error>) => {
  console.error(...args.map((item) => chalk.red(item)));
};

/**
 * Print error and insert prefix in front
 * @param args
 */
export const errorWithPrefix = (...args: Parameters<typeof console.error>) => {
  error(logPrefix, ...args);
};

/**
 * Print info with gradient colors
 * @param content
 * @param options
 */
export const gradient = (
  content: string | number | boolean,
  options?: { colors?: tinycolor.ColorInput[] },
) => {
  log(_gradientString(...(options?.colors ?? defaultColors))(String(content)));
};

/**
 * Print info with gradient colors and insert prefix in front
 * @param content
 * @param options
 */
export const gradientWithPrefix = (
  content: string | number | boolean,
  options?: { colors?: tinycolor.ColorInput[] },
) => {
  gradient(logPrefix + content, options);
};

/**
 * New lines
 * @param lines
 */
export const newLine = (lines?: number) => {
  if (!lines) lines = 1;

  for (let i = 0; i < lines; i++) {
    log();
  }
};
