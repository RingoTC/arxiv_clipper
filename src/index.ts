#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { logger, generateTraceId, setTraceId } from './utils/logger';
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

// Generate a trace ID for this CLI session
const sessionTraceId = generateTraceId();
setTraceId(sessionTraceId);

// Log startup
logger.info(`Starting arXiv Downloader CLI v${packageJson.version}`, {
  version: packageJson.version,
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch
});

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
      logger.info('Direct URL input detected, calling download command', { url, options });
      
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
      logger.info('No arguments or invalid URL, showing help');
      program.outputHelp();
    }
  });

// Handle unknown commands
program.on('command:*', () => {
  const command = program.args.join(' ');
  logger.error(`Invalid command: ${command}`);
  console.error(chalk.red(`Invalid command: ${command}`));
  console.log(`See ${chalk.blue('--help')} for a list of available commands.`);
  process.exit(1);
});

// Log command execution
const originalParse = program.parse;
program.parse = function(argv?: string[]) {
  if (argv && argv.length > 2) {
    const command = argv.slice(2).join(' ');
    if (command) {
      logger.info(`Executing command: ${command}`, { command, args: argv.slice(2) });
    }
  }
  return originalParse.call(this, argv);
};

// Handle errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  console.error(chalk.red('Error:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason: String(reason) });
  console.error(chalk.red('Unhandled rejection:'), reason);
  process.exit(1);
});

// Parse arguments
program.parse(process.argv); 