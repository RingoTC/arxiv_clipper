#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
const packageJson = require('../package.json');

// Import commands
import downloadCommand from './commands/download';
import listCommand from './commands/list';
import deleteCommand from './commands/delete';
import sourceCommand from './commands/source';
import pdfCommand from './commands/pdf';
import cleanCommand from './commands/clean';
import bibtexCommand from './commands/bibtex';
import webCommand from './commands/bibtex-web';
import openCommand from './commands/open';
import migrateCommand from './commands/migrate';
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
webCommand(program);
openCommand(program);
migrateCommand(program);

// Handle direct URL input (default to download command)
program
  .arguments('[url]')
  .option('-t, --tag <tag>', 'Tag for organizing papers', 'default')
  .option('--github <url>', 'GitHub repository URL to download along with the paper')
  .action(async (url?: string, options?: CommandOptions) => {
    if (url && url.includes('arxiv.org')) {
      // If URL is provided, call the download command
      const downloadCmd = program.commands.find(cmd => cmd.name() === 'download');
      if (downloadCmd) {
        // Call the download command directly
        const args = ['node', 'script.js', 'download', url];
        if (options?.tag) args.push('-t', options.tag);
        if (options?.github) args.push('--github', options.github);
        program.parse(args);
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