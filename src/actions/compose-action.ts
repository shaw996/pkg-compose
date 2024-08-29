import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { log as clackLog, intro, outro } from '@clack/prompts';
import chalk from 'chalk';
import { parse } from 'yaml';

import { execCmd } from '@/helpers/utils';
import { shawConfirm } from '@/prompts/shaw';

const COMPOSE_FILE_NAME = 'package-compose.yaml';
const COMPOSE_FILE_PATH = path.resolve(process.cwd(), `./${COMPOSE_FILE_NAME}`);
// TODO 更新模版
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
// const GROUP_FILE_NAME = 'shawkit-group.yaml';

const createPackageCompose = () => {
  writeFileSync(COMPOSE_FILE_NAME, COMPOSE_FILE_TEMPLATE, { encoding: 'utf-8' });
};

export interface ComposeRunActionOptions {
  config?: string;
}

interface ComposeDepOptions {
  name: string;
  version: string;
  description: string;
  packageJson?: object;
}

export interface ComposeOptions {
  name: string;
  description: string;
  manager: 'npm' | 'yarn' | 'pnpm';
  devDependencies?: {
    [name: string]: ComposeDepOptions;
  };
  configurations?: {
    [name: string]: string | string[];
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
export const composeRunAction = async (options: ComposeRunActionOptions) => {
  const yamlString = readFileSync(COMPOSE_FILE_PATH, { encoding: 'utf-8' });
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
    configurations = {},
    description,
    devDependencies = {},
    manager = 'npm',
    name,
  } = parse(yamlString) as ComposeOptions;

  intro(chalk.cyanBright(`Run ${COMPOSE_FILE_NAME} '${name}'`));

  if (description) {
    clackLog.info(chalk.grey(description));
  }

  const deps = Object.values(devDependencies);

  for await (const dep of deps) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
    const { description: depDesc, name: depName, packageJson, version } = dep;
    const fullDepName = `${depName}@${version}`;

    clackLog.step(`Installing ${fullDepName}`);

    if (depDesc) {
      clackLog.info(chalk.grey(depDesc));
    }

    await execCmd(`${manager} install -D ${fullDepName}`, {
      fail: (errMsg) => {
        clackLog.error(chalk.redBright(`Failed to install ${fullDepName}\n${errMsg}`));
      },
      success: () => {
        clackLog.success(chalk.greenBright(`Installed ${fullDepName} successfully`));
      },
    });
  }

  outro(chalk.greenBright('Installed all devDependencies'));
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
