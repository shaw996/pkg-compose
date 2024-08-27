import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { intro, outro } from '@clack/prompts';
import chalk from 'chalk';

import { log } from '@/helpers/logger';
import { shawConfirm } from '@/prompts/shaw';

const COMPOSE_FILE_NAME = 'package-compose.json';

const COMPOSE_FILE_PATH = path.resolve(process.cwd(), `./${COMPOSE_FILE_NAME}`);

const COMPOSE_FILE_TEMPLATE = `{
  "name": "Package compose of Shaw996",
  "description": "Integrate some dependencies better for standards.",
  "engine": {
    "pnpm": ">=9.x",
    "node": ">=20.10.x"
  },
  "actions": [
    {
      "name": "commitizen",
      "description": "Git commit, but play nice with conventions.",
      "commands": ["npm install commitizen --save-dev -save-exact"],
      "configurations": []
    }
  ]
}
`;

const createPackageCompose = () => {
  writeFileSync(COMPOSE_FILE_NAME, COMPOSE_FILE_TEMPLATE, { encoding: 'utf-8' });
};

export interface ComposeActionOptions {
  config?: string;
}

export const composeAction = (options: ComposeActionOptions) => {
  const { config } = options;

  log(options);
  log(config);
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
