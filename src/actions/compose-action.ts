/* eslint-disable unused-imports/no-unused-imports */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { SAFE_ANY } from '@/helpers/type';

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { log as clackLog, intro, outro } from '@clack/prompts';
import chalk from 'chalk';
import { parse } from 'yaml';

import { runCmd } from '@/helpers/utils';
import { shawConfirm } from '@/prompts/shaw';

const COMPOSE_FILE_NAME = 'package-compose.yaml';
const COMPOSE_FILE_PATH = path.resolve(process.cwd(), `./${COMPOSE_FILE_NAME}`);
// TODO Update template
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
  postinstall?: string;
  configurations?: string[];
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
  const cmdsRunFailed: (string | null)[] = [];
  let cmdsRunFailedCount = 0;

  // Install dependencies in order
  for await (const dep of deps) {
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
      configurations,
      description: depDesc,
      name: depName,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
      packageJson,
      postinstall,
      version,
    } = dep;
    const fullDepName = `${depName}@${version}`;

    clackLog.step(`${fullDepName}: Installing`);

    if (depDesc) {
      clackLog.info(chalk.grey(depDesc));
    }

    // Run installation command
    const cmd = `${manager} install -D ${fullDepName}`;
    const cmdsRunFailedScoped: typeof cmdsRunFailed = [];

    try {
      await runCmd(cmd, {
        fail: (errMsg) => {
          cmdsRunFailedScoped.unshift(cmd);
          clackLog.error(chalk.redBright(`Failed to install ${fullDepName}\n${errMsg}`));
        },
        success: () => {
          clackLog.success(chalk.greenBright(`Installed ${fullDepName} successfully`));
        },
      });
    } catch (err: SAFE_ANY) {
      // I don't expect to be blocked after running command failed.
      cmdsRunFailedScoped.unshift(cmd);
      clackLog.error(chalk.redBright(`Failed to run ${cmd}\n${err?.message ?? 'Unknown Error'}`));
    }

    // Run postinstall
    if (postinstall) {
      clackLog.step(`Running postinstall`);
      try {
        await runCmd(postinstall, {
          fail: (errMsg) => {
            cmdsRunFailedScoped.unshift(cmd);
            clackLog.error(chalk.redBright(`Failed to run postinstall\n${errMsg}`));
          },
          success: () => {
            clackLog.success(chalk.greenBright(`Run postinstall successfully`));
          },
        });
      } catch (err: SAFE_ANY) {
        // I don't expect to be blocked after running postinstall failed.
        cmdsRunFailedScoped.unshift(cmd);
        clackLog.error(
          chalk.redBright(`Failed to run postinstall\n${err?.message ?? 'Unknown Error'}`),
        );
      }
    }

    if (cmdsRunFailedScoped.length) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
      cmdsRunFailedCount += cmdsRunFailedScoped.length;

      // Splits the commands ran failed of each dependency
      cmdsRunFailedScoped.unshift(null);
      cmdsRunFailedScoped.push(fullDepName);
      cmdsRunFailedScoped.reverse(); // Order

      cmdsRunFailed.push(...cmdsRunFailedScoped);
    }
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
