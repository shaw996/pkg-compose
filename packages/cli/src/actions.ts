import type { SAFE_ANY } from './typedefs';

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { intro } from '@clack/prompts';
import chalk from 'chalk';
import { parse } from 'yaml';

import { INFO_COLOR } from './constants';
import {
  shawConfirm,
  shawDone,
  shawFail,
  shawInfo,
  shawIntro,
  shawLine,
  shawWarn,
} from './prompts';
import { downloadFile, fetchFile, runCmd } from './utils';

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
  dev_dependencies?: {
    [name: string]: ComposeDepOptions;
  };
  remote: string[];
}

export interface PkgConfig {
  manager: 'npm' | 'yarn' | 'pnpm';
  pkgComposes: string[];
}

const COMPOSE_YAML_NAME = 'pkg-compose.yaml';
const COMPOSE_YAML_PATH = resolve(process.cwd(), `./${COMPOSE_YAML_NAME}`);

const PACKAGE_JSON_PATH = resolve(process.cwd(), `./package.json`);
const PKGCONFIG_JSON_PATH = resolve(process.cwd(), `./pkgconfig.json`);

/**
 * Generete a pkg-compose.yaml for sample
 */
const generatePkgCompose = () => {
  writeFileSync(
    COMPOSE_YAML_NAME,
    `
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
          changelog.config.js: https://raw.githubusercontent.com/shaw996/shaw/main/packages/%40composes/gitcommit/changelog.config.js
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
          commitlint.config.js: https://raw.githubusercontent.com/shaw996/shaw/main/packages/%40composes/gitcommit/commitlint.config.js
      husky:
        name: husky
        version: 9.1.5
        description: 用于在 Git 操作（如 commit、push 等）之前或之后运行脚本的工具
        postinstall: npx husky install
        package_json:
          scripts:
            prepare: npx husky install
        configuration:
          .husky/commit-msg: https://raw.githubusercontent.com/shaw996/shaw/main/packages/%40composes/gitcommit/.husky/commit-msg
          .husky/prepare-commit-msg: https://raw.githubusercontent.com/shaw996/shaw/main/packages/%40composes/gitcommit/.husky/prepare-commit-msg
    
    `,
    { encoding: 'utf-8' },
  );
};

/**
 * Merge properties in package.json
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
 * Recognize pkg-compose.yaml
 * @param yamlText
 */
const recognizePkgCompose = async (manager: PkgConfig['manager'], pkgCompose: string) => {
  manager = manager ?? 'npm';

  const { description, dev_dependencies = {}, name } = parse(pkgCompose) as ComposeOptions;

  // Introduce
  shawIntro(
    chalk.cyanBright(`Recognizing "${name}"`) + (description ? `\n${chalk.grey(description)}` : ''),
  );
  shawLine();

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

    shawInfo(chalk.bgHex(INFO_COLOR)(fullDepName) + (depDesc ? `\n${chalk.grey(depDesc)}` : ''));

    // Run installation command
    const cmd = `${manager} install -D ${fullDepName}`;

    await runCmd(cmd, {
      fail: (errMsg) => {
        cmdsRanFailedCount++;
        shawFail(`Error occurs during run "${cmd}":\n${errMsg}`);
      },
      success: () => {
        shawDone(cmd);
      },
    });

    // Run postinstall
    if (postinstall) {
      await runCmd(postinstall, {
        fail: (errMsg) => {
          cmdsRanFailedCount++;
          shawFail(`Error occurs during running "${postinstall}":\n${errMsg}`);
        },
        success: () => {
          shawDone(postinstall!);
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
          shawDone(configuration[name]!);
        } catch (err: SAFE_ANY) {
          shawFail(`Error occurs during downloading "${name}":\n${err.message}`);
        }
      }
    }

    shawLine();
  }

  // Merge package.json and update it
  if (pkgJsonWaitForMerging !== null) {
    shawInfo(chalk.bgHex(INFO_COLOR)('Updating package.json'));
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

    shawDone('Complete updating package.json');
  }

  if (cmdsRanFailedCount > 0) {
    shawFail(`${cmdsRanFailedCount} commands failed, please check and run these commands manually`);
  }

  shawLine(2);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
export const runAction = async (options: ComposeRunActionOptions) => {
  const pkgconfig: PkgConfig = JSON.parse(readFileSync(PKGCONFIG_JSON_PATH, { encoding: 'utf-8' }));

  const { manager, pkgComposes } = pkgconfig;

  if (!pkgComposes || !pkgComposes.length) {
    return;
  }

  for await (const url of pkgComposes) {
    const resp = await fetchFile(url);

    if (resp.status === 404) {
      shawFail(`404 Not Found: ${url}`);
      continue;
    }

    const pkgComposeText = await resp.text();

    await recognizePkgCompose(manager, pkgComposeText);
  }
};

export const generateAction = async () => {
  intro(chalk.cyanBright(`Generating ${COMPOSE_YAML_NAME}`));

  let shouldContinue = true;

  if (existsSync(COMPOSE_YAML_PATH)) {
    shouldContinue = !!(await shawConfirm({
      initialValue: false,
      message: `${COMPOSE_YAML_NAME} already exists. Do you want to cover it?`,
    }));

    if (shouldContinue) {
      generatePkgCompose();
      shawDone(`Open ${chalk.cyanBright(COMPOSE_YAML_NAME)} and add configurations you prefered`);
    } else {
      shawDone(`Click to check ${chalk.cyanBright(COMPOSE_YAML_NAME)} existed`);
    }
  } else {
    generatePkgCompose();
    shawDone(`Open ${chalk.cyanBright(COMPOSE_YAML_NAME)} and add configurations you prefered`);
  }

  process.exit(0);
};
