/* eslint-disable unused-imports/no-unused-imports */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { SAFE_ANY } from '@/helpers/type';

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { intro } from '@clack/prompts';
import chalk from 'chalk';
import { parse } from 'yaml';

import { runCmd } from '@/helpers/utils';
import {
  COLOR_INFO,
  shawConfirm,
  shawFailed,
  shawInfo,
  shawIntro,
  shawNewline,
  shawOutro,
  shawSuccess,
  shawWarn,
} from '@/prompts/shaw';

const COMPOSE_YAML_NAME = 'package-compose.yaml';
const COMPOSE_YAML_PATH = path.resolve(process.cwd(), `./${COMPOSE_YAML_NAME}`);
const PACKAGE_JSON_PATH = path.resolve(process.cwd(), `./package.json`);
// TODO Update template
const COMPOSE_YAML_TEMPLATE = `{
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

/**
 * Create a package-compose.yaml template
 */
const createPackageCompose = () => {
  writeFileSync(COMPOSE_YAML_NAME, COMPOSE_YAML_TEMPLATE, { encoding: 'utf-8' });
};

/**
 * Merge object
 * @param from
 * @param to
 * @param depName
 */
const mergeObject = (
  from: Record<string, SAFE_ANY>,
  to: Record<string, SAFE_ANY>,
  depName: string,
  propertyPath?: string,
) => {
  Object.keys(from).forEach((key) => {
    const fromValue = from[key];
    const toValue = to[key];

    if (toValue === void 0 || toValue === null) {
      to[key] = fromValue;
    } else {
      const _propertyPath = [propertyPath, key].filter(Boolean).join('.');

      if (typeof toValue === 'object' && typeof fromValue === 'object') {
        mergeObject(fromValue, toValue, depName, _propertyPath);
      } else if (toValue !== fromValue) {
        to[`${key}[${depName} Conflicts]`] = fromValue;
        shawWarn(
          `Property "${_propertyPath}" in package_json of ${depName} conflicts with others exists, please open package.json and fix the confilcts.`,
        );
      }
    }
  });
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
  package_json?: Record<string, SAFE_ANY>;
}

export interface ComposeOptions {
  name: string;
  description: string;
  manager: 'npm' | 'yarn' | 'pnpm';
  dev_dependencies?: {
    [name: string]: ComposeDepOptions;
  };
  remote: string[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
export const composeRunAction = async (options: ComposeRunActionOptions) => {
  const yamlString = readFileSync(COMPOSE_YAML_PATH, { encoding: 'utf-8' });
  const {
    description,
    dev_dependencies = {},
    manager = 'npm',
    name,
  } = parse(yamlString) as ComposeOptions;

  // Introduce
  shawIntro(
    chalk.cyanBright(`Run ${COMPOSE_YAML_NAME} '${name}'`) +
      (description ? `\n${chalk.grey(description)}` : ''),
  );
  shawNewline();

  const deps = Object.values(dev_dependencies);
  let pkgJsonWaitForMerging: [depName: string, Record<string, SAFE_ANY>][] = null!;
  let cmdsRanFailedCount = 0;

  // Install dependencies in order
  for await (const dep of deps) {
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
      configurations,
      description: depDesc,
      name: depName,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
      package_json: packageJson,
      postinstall,
      version,
    } = dep;
    const fullDepName = `${depName}@${version}`;

    shawInfo(chalk.bgHex(COLOR_INFO)(fullDepName) + (depDesc ? `\n${chalk.grey(depDesc)}` : ''));

    // Run installation command
    const cmd = `${manager} install -D ${fullDepName}`;

    await runCmd(cmd, {
      fail: (errMsg) => {
        cmdsRanFailedCount++;
        shawFailed(`Error occurs during run "${cmd}":\n${errMsg}`);
      },
      success: () => {
        shawSuccess(cmd);
      },
    });

    // Run postinstall
    if (postinstall) {
      await runCmd(postinstall, {
        fail: (errMsg) => {
          cmdsRanFailedCount++;
          shawFailed(`Error occurs during running "${postinstall}":\n${errMsg}`);
        },
        success: () => {
          shawSuccess(postinstall!);
        },
      });
    }

    // Collect packageJson and then update together
    if (packageJson) {
      if (pkgJsonWaitForMerging === null) {
        pkgJsonWaitForMerging = [];
      }

      pkgJsonWaitForMerging.push([fullDepName, packageJson]);
    }

    shawNewline();
  }

  // Merge package.json and update it
  if (pkgJsonWaitForMerging !== null) {
    shawInfo(chalk.bgHex(COLOR_INFO)('Update package.json'));
    const mergedPkgJson = JSON.parse(
      readFileSync(PACKAGE_JSON_PATH, {
        encoding: 'utf-8',
      }),
    );

    pkgJsonWaitForMerging.forEach(([depName, packageJson]) => {
      mergeObject(packageJson, mergedPkgJson, depName);
    });
    writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(mergedPkgJson, null, 2), {
      encoding: 'utf-8',
    });

    shawSuccess('Complete updating package.json');
  }

  if (cmdsRanFailedCount > 0) {
    shawOutro(
      chalk.yellowBright(
        `${cmdsRanFailedCount} commands failed, please check and run these commands manually`,
      ),
    );
  } else {
    shawOutro(chalk.cyanBright(`Run ${COMPOSE_YAML_NAME} '${name}' successfully`));
  }
};

export const composeInitAction = async () => {
  intro(chalk.cyanBright(`Create ${COMPOSE_YAML_NAME}`));

  let shouldContinue = true;

  if (existsSync(COMPOSE_YAML_PATH)) {
    shouldContinue = !!(await shawConfirm({
      initialValue: false,
      message: `${COMPOSE_YAML_NAME} already exists. Do you want to cover it?`,
    }));

    if (shouldContinue) {
      createPackageCompose();
      shawOutro(`Open ${chalk.cyanBright(COMPOSE_YAML_NAME)} and add configurations you prefered`);
    } else {
      shawOutro(`Click to check ${chalk.cyanBright(COMPOSE_YAML_NAME)} existed`);
    }
  } else {
    createPackageCompose();
    shawOutro(`Open ${chalk.cyanBright(COMPOSE_YAML_NAME)} and add configurations you prefered`);
  }

  process.exit(0);
};
