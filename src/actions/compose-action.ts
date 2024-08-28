import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { intro, outro } from '@clack/prompts';
import chalk from 'chalk';
import { parse } from 'yaml';

import { log } from '@/helpers/logger';
import { shawConfirm } from '@/prompts/shaw';

const COMPOSE_FILE_NAME = 'shawkit-compose.yaml';
const COMPOSE_FILE_PATH = path.resolve(process.cwd(), `./${COMPOSE_FILE_NAME}`);
const COMPOSE_FILE_TEMPLATE = `{
name: shawkit
description: main package-compose of shawkit
engine:
  node: '>= 20.10.0'
  pnpm: '>= 9.4.0'
  npm: '>= 10.2.3'
groups:
  standards:
    group_name: standards
    description: 前端代码规范
    url: ./standards
`;
// eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
const GROUP_FILE_NAME = 'shawkit-group.yaml';

const createPackageCompose = () => {
  writeFileSync(COMPOSE_FILE_NAME, COMPOSE_FILE_TEMPLATE, { encoding: 'utf-8' });
};

export interface ComposeActionOptions {
  config?: string;
}

export const composeAction = (options: ComposeActionOptions) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
  const { config } = options;

  // log(options);
  // log(config);
  const yamlString = readFileSync(COMPOSE_FILE_PATH, { encoding: 'utf-8' });
  const yamlObj = parse(yamlString);

  log(yamlObj);
};

export const composeInitAction = async () => {
  intro(chalk.cyanBright(`Create ${COMPOSE_FILE_NAME}`));

  let shouldContinue = true;

  if (existsSync(COMPOSE_FILE_PATH)) {
    shouldContinue = !!(await shawConfirm({
      initialValue: false,
      message: `${COMPOSE_FILE_NAME} already exists. Do you want to cover it?`,
    }));

    if (shouldContinue) {
      createPackageCompose();
      outro(`Open ${chalk.cyanBright(COMPOSE_FILE_NAME)} and add configurations you prefered`);
    } else {
      outro(`Click to check ${chalk.cyanBright(COMPOSE_FILE_NAME)} existed`);
    }
  } else {
    createPackageCompose();
    outro(`Open ${chalk.cyanBright(COMPOSE_FILE_NAME)} and add configurations you prefered`);
  }

  process.exit(0);
};
