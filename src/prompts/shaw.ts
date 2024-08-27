import type { SAFE_ANY } from '@/helpers/type';

import { type ConfirmOptions, cancel, confirm, isCancel } from '@clack/prompts';
import chalk from 'chalk';

export const shawCancel = (value: SAFE_ANY) => {
  if (isCancel(value)) {
    cancel(`${chalk.red('✖')} Operation cancelled`);
    process.exit(0);
  }
};

export const shawConfirm = async (opts: ConfirmOptions): ReturnType<typeof confirm> => {
  const isContinue = await confirm(opts);

  shawCancel(isContinue);

  return isContinue;
};
