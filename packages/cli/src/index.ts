import { Command } from 'commander';

import pkg from '../package.json';

import { composeInitAction, composeRunAction } from './actions/compose-action';
import { error, log, newLine } from './helpers/logger';
import { createDefaultAction, printLogAndReturnDesc } from './helpers/utils';

const shawcli = new Command();

shawcli
  .name('shawcli')
  .usage('[command]')
  .description(printLogAndReturnDesc(`\nShaw Kit CLI v${pkg.version}\n`, 'CLI helper for personal'))
  .version(pkg.version, '-v, --version', 'Output the current version')
  .helpOption('-h, --help', 'Display help for command')
  .allowUnknownOption()
  .action(createDefaultAction(['compose'], 'shawcli --help'));

const composeCommand = shawcli
  .command('compose')
  .description('Installing npm dependencies and generating configurations from remote')
  .usage('[command]')
  .helpOption('-h, --help', 'Display help for command')
  .allowUnknownOption()
  .action(createDefaultAction(['init', 'run'], 'shawcli compose --help'));

// compose init
composeCommand
  .command('init')
  .description('Create a template of pkg-compose.yaml')
  .action(composeInitAction);

// compose run
composeCommand
  .command('run')
  .description('Looking for .packagecomposerc and handling pkg-compose.yaml declared in it')
  .option(
    '-c --config [string]',
    'Specify a configuration file, e.g., ./pkg-compose.yaml or https://[REMOTE]/pkg-compose.yaml',
  )
  .action(composeRunAction);

shawcli.parseAsync(process.argv).catch(async (reason) => {
  newLine();
  error('Unexpected error. Please report it as a bug:');
  log(reason);
  newLine();
  process.exit(1);
});
