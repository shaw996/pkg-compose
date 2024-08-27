/* eslint-disable no-console */
import type tinycolor from 'tinycolor2';

import chalk from 'chalk';
import { default as _gradientString } from 'gradient-string';

export const defaultColors = ['#a862ea', '#338ef7'] as const;

export const gradientString = _gradientString(...defaultColors);

const logPrefix = gradientString('Shaw Kit CLI:');

export const log = (...args: Parameters<typeof console.log>) => {
  console.log(...args);
};

export const logWithPrefix = (...args: Parameters<typeof console.log>) => {
  log(logPrefix, ...args);
};

export const error = (...args: Parameters<typeof console.error>) => {
  console.error(...args.map((item) => chalk.red(item)));
};

export const errorWithPrefix = (...args: Parameters<typeof console.error>) => {
  error(logPrefix, ...args);
};

export const gradient = (
  content: string | number | boolean,
  options?: { colors?: tinycolor.ColorInput[] },
) => {
  log(_gradientString(...(options?.colors ?? defaultColors))(String(content)));
};

export const gradientWithPrefix = (
  content: string | number | boolean,
  options?: { colors?: tinycolor.ColorInput[] },
) => {
  gradient(logPrefix + content, options);
};

export const newLine = (lines?: number) => {
  if (!lines) lines = 1;

  for (let i = 0; i < lines; i++) {
    log();
  }
};
