#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import * as packageJson from '../package.json';

// Import commands
import downloadCommand from './commands/download';
// @ts-ignore
import listCommand from './commands/list';
// @ts-ignore
import deleteCommand from './commands/delete';
// @ts-ignore
import sourceCommand from './commands/source';
// @ts-ignore
import pdfCommand from './commands/pdf';
// @ts-ignore
import cleanCommand from './commands/clean';
// @ts-ignore
import bibtexCommand from './commands/bibtex';
// @ts-ignore
import bibtexWebCommand from './commands/bibtex-web';
import { CommandOptions } from './types';

// Set up CLI
const program = new Command();
program
  .name('adown')
  .description('A command-line tool for downloading and managing arXiv papers')
  .version(packageJson.version);

// Register commands
downloadCommand(program);
listCommand(program);
deleteCommand(program);
sourceCommand(program);
pdfCommand(program);
cleanCommand(program);
bibtexCommand(program);
bibtexWebCommand(program);

// Handle direct URL input (default to download command)
program
  .arguments('[url]')
  .option('-t, --tag <tag>', 'Tag for organizing papers', 'default')
  .action(async (url?: string, options?: CommandOptions) => {
    if (url && url.includes('arxiv.org')) {
      // If URL is provided, call the download command
      const downloadCmd = program.commands.find(cmd => cmd.name() === 'download');
      if (downloadCmd) {
        // Call the download command directly
        program.parse(['node', 'script.js', 'download', url, ...(options?.tag ? ['-t', options.tag] : [])]);
      }
    } else if (!process.argv.slice(2).length || (url && !url.includes('arxiv.org'))) {
      // Show help if no arguments or invalid URL
      program.outputHelp();
    }
  });

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red(`Invalid command: ${program.args.join(' ')}`));
  console.log(`See ${chalk.blue('--help')} for a list of available commands.`);
  process.exit(1);
});

// Parse arguments
program.parse(process.argv); 