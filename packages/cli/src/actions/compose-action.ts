/* eslint-disable unused-imports/no-unused-imports */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { SAFE_ANY } from '@/helpers/type';

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { intro } from '@clack/prompts';
import chalk from 'chalk';
import { parse } from 'yaml';

import { downloadFile, fetchFile } from '@/helpers/downloader';
import { error } from '@/helpers/logger';
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

const COMPOSE_YAML_NAME = 'pkg-compose.yaml';
const COMPOSE_YAML_PATH = resolve(process.cwd(), `./${COMPOSE_YAML_NAME}`);
const PKGCONFIG_JSON_PATH = resolve(process.cwd(), `./pkgconfig.json`);
const PACKAGE_JSON_PATH = resolve(process.cwd(), `./package.json`);
const COMPOSE_YAML_TEMPLATE = `
# Name of yaml
name: Git commit规范工具集合
# Description of yaml
description: 用于约定git commit规范的工具
# Node Package Managers \`npm\`、\`yarn\`、\`pnpm\` 
manager: 'pnpm'
# Devdependencies associate to devDependencies in \`package.json\`
dev_dependencies:
  # Name of dependency
  # ⚠️ Need a unique key althrough it looks meaningless at present.
  commitizen:
    # Name associates to npm packages
    name: commitizen
    # Version of the packages
    version: 4.3.0
    # Description of the package
    # Use a short sentence to describe the meaning of this package
    description: 用于规范化Git提交消息的工具
  git-cz:
    name: git-cz
    version: 4.9.0
    description: 用于帮助开发者创建符合约定式提交（Conventional Commits）规范的 Git 提交消息
    # Associates to some configurations in \`package.json\`
    package_json:
      config:
        commitizen:
          path: ./node_modules/git-cz
    # The download links of config files
    configuration:
      # The keys of configuration represent local relative paths
      # e.g., "changelog.config.js" represents "./changelog.config.js"
      # The values of configuration represent download links
      changelog.config.js: https://raw.githubusercontent.com/shaw996/shawkit/main/packages/%40composes/gitcommit/changelog.config.js
  '@commitlint/config-conventional':
    name: '@commitlint/config-conventional'
    version: 19.2.2
    description: 预定义的配置包，用于 commitlint，它提供了一套基于约定式提交（Conventional Commits）规范的规则集
  '@commitlint/cli':
    name: '@commitlint/cli'
    version: 19.4.0
    description: 用于检查 Git 提交消息是否符合约定式提交（Conventional Commits）规范的命令行工具
    package_json:
      scripts:
        prepare: npx husky install
    configuration:
      commitlint.config.js: https://raw.githubusercontent.com/shaw996/shawkit/main/packages/%40composes/gitcommit/commitlint.config.js
  husky:
    name: husky
    version: 9.1.5
    description: 用于在 Git 操作（如 commit、push 等）之前或之后运行脚本的工具
    postinstall: npx husky install
    package_json:
      scripts:
        prepare: npx husky install
    configuration:
      .husky/commit-msg: https://raw.githubusercontent.com/shaw996/shawkit/main/packages/%40composes/gitcommit/.husky/commit-msg
      .husky/prepare-commit-msg: https://raw.githubusercontent.com/shaw996/shawkit/main/packages/%40composes/gitcommit/.husky/prepare-commit-msg

`;

/**
 * Create a pkg-compose.yaml template
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
  from: ComposeDepOptions['package_json'],
  to: ComposeDepOptions['package_json'],
  depName: string,
  propertyPath?: string,
) => {
  Object.keys(from!).forEach((key) => {
    const fromValue = from![key];
    const toValue = to![key];

    if (toValue === void 0 || toValue === null) {
      to![key] = fromValue;
    } else {
      const _propertyPath = [propertyPath, key].filter(Boolean).join('.');

      if (typeof toValue === 'object' && typeof fromValue === 'object') {
        mergeObject(fromValue, toValue, depName, _propertyPath);
      } else if (toValue !== fromValue) {
        to![`${key}[${depName} Conflicts]`] = fromValue;
        shawWarn(
          `Property "${_propertyPath}" in package_json of ${depName} conflicts with others exists, please open package.json and fix the confilcts.`,
        );
      }
    }
  });
};

/**
 * 解析pkg-compose.yaml
 * @param yamlText
 */
const recognizePkgCompose = async (pkgCompose: string) => {
  const {
    description,
    dev_dependencies = {},
    manager = 'npm',
    name,
  } = parse(pkgCompose) as ComposeOptions;

  // Introduce
  shawIntro(
    chalk.cyanBright(`Running ${COMPOSE_YAML_NAME} '${name}'`) +
      (description ? `\n${chalk.grey(description)}` : ''),
  );
  shawNewline();

  const deps = Object.values(dev_dependencies);
  let pkgJsonWaitForMerging: [string, ComposeDepOptions['package_json']][] = null!;
  let cmdsRanFailedCount = 0;

  // Install dependencies in order
  for await (const dep of deps) {
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
      configuration,
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

    // Download configure files
    if (configuration) {
      const configNames: string[] = Object.keys(configuration);

      for await (const name of configNames) {
        try {
          await downloadFile(name, configuration[name]!);
          shawSuccess(configuration[name]!);
        } catch (err: SAFE_ANY) {
          shawFailed(`Error occurs during downloading "${name}":\n${err.message}`);
        }
      }
    }

    shawNewline();
  }

  // Merge package.json and update it
  if (pkgJsonWaitForMerging !== null) {
    shawInfo(chalk.bgHex(COLOR_INFO)('Updating package.json'));
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

export interface ComposeRunActionOptions {
  config?: string;
}

interface ComposeDepOptions {
  name: string;
  version: string;
  description: string;
  postinstall?: string;
  configuration?: { [key: string]: string };
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
  const pkgconfigJson: { [key: string]: string } = JSON.parse(
    readFileSync(PKGCONFIG_JSON_PATH, { encoding: 'utf-8' }),
  );

  const pkgcomposeUrls = Object.values(pkgconfigJson);

  for await (const url of pkgcomposeUrls) {
    const resp = await fetchFile(url);

    if (resp.status === 404) {
      error(`404 Not Found: ${url}`);
      continue;
    }

    const pkgCompose = await resp.text();

    await recognizePkgCompose(pkgCompose);
  }

  return;
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
