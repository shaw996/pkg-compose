import type { CommandName } from '@helpers/type';

import chalk from 'chalk';
import { Command } from 'commander';

import pkg from '../package.json';

import { composeAction, composeInitAction } from './actions/compose-action';
import { error, log, newLine } from './helpers/logger';
import { matchMostSimilarString } from './helpers/matcher';
import { execCmd, getCommandDescAndLog } from './helpers/utils';

const commandList: CommandName[] = ['compose'];

const shawkit = new Command();

shawkit
  .name('shawkit')
  .usage('[command]')
  .description(getCommandDescAndLog(`\nShaw Kit CLI v${pkg.version}\n`, ''))
  .version(pkg.version, '-v, --version', 'Output the current version')
  .helpOption('-h, --help', 'Display help for command')
  .allowUnknownOption()
  .action(async (_, command) => {
    let isArgs = false;

    if (command) {
      const arg = command.args?.[0];

      if (arg && !commandList.includes(arg)) {
        isArgs = true;

        const matchCommand = matchMostSimilarString(arg, commandList);

        if (matchCommand) {
          error(`Unknown command '${arg}'. Did you mean '${chalk.underline(matchCommand)}'?`);
        } else {
          error(`Unknown command '${arg}'`);
        }
      }
    }

    if (!isArgs) {
      // const helpInfo = await oraExecCmd('shawkit --help');
      const helpInfo = await execCmd('npm run test -- --help');

      const helpInfoArr = helpInfo
        .split('\n')
        .map((info) => {
          if (!info || info.includes('Shaw Kit CLI v') || info.startsWith('>')) {
            return null;
          }

          const command = info.match(/(\w+)\s\[/)?.[1];

          if (command) {
            return info.replace(command, chalk.cyan(command));
          }

          return info;
        })
        .filter(Boolean);

      log(helpInfoArr.join('\n'));
    }

    process.exit(0);
  });

shawkit
  .command('compose')
  .description('Integrating npm packages into project step by step')
  .option('-c --config [string]', 'Specify a configuration file, e.g., ./package-compose.yaml')
  .action(composeAction)
  // init
  .command('init')
  .description('Create a template of package-compose.yaml')
  .action(composeInitAction);

shawkit.parseAsync(process.argv).catch(async (reason) => {
  newLine();
  error('Unexpected error. Please report it as a bug:');
  log(reason);
  newLine();
  process.exit(1);
});
