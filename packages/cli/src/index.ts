import { Command } from 'commander';

import pkg from '../package.json';

import { generateAction, runAction } from './actions';
import { shawFail, shawGradient, shawLine } from './prompts';
import { createDefaultAction } from './utils';

const pkgCompose = new Command();

pkgCompose
  .name('pkgc')
  .usage('[command]')
  .description(
    (() => {
      shawGradient(`pkg-compose v${pkg.version}\n`);

      return '';
    })(),
  )
  .version(pkg.version, '-v, --version', 'Output the current version')
  .helpOption('-h, --help', 'Display help for command')
  .allowUnknownOption()
  .action(createDefaultAction(['generate', 'run'], 'pkgc --help'));

// pkgc r [-c --config]
// pkgc run [-c --config]
pkgCompose
  .command('run')
  .alias('r')
  .description("Read pkgconfig.json, then request and recognize pkg-compose.yaml's content")
  .usage('[command]')
  .helpOption('-h, --help', 'Display help for command')
  .option('-c --config [string]', "Use particular pkg-compose.yaml's url")
  .allowUnknownOption(false)
  .action(runAction);

// pkg g
// pkg generate
pkgCompose
  .command('generate')
  .alias('g')
  .description('Generate a pkg-compose.yaml for sample')
  .action(generateAction);

pkgCompose.parseAsync(process.argv).catch(async (reason) => {
  shawLine();
  shawFail(reason);
  shawLine();
  process.exit(1);
});
