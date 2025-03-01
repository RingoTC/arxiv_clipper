#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const packageJson = require('../package.json');

// Import commands
const downloadCommand = require('./commands/download');
const listCommand = require('./commands/list');
const deleteCommand = require('./commands/delete');
const sourceCommand = require('./commands/source');
const pdfCommand = require('./commands/pdf');

// Set up CLI
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

// Handle direct URL input (default to download command)
program
  .arguments('[url]')
  .option('-t, --tag <tag>', 'Tag for organizing papers', 'default')
  .action(async (url, options) => {
    if (url && url.includes('arxiv.org')) {
      // If URL is provided, call the download command
      const downloadCmd = program.commands.find(cmd => cmd.name() === 'download');
      if (downloadCmd) {
        // Pass the URL and let the download command handle the tag
        await downloadCmd.action(url, options);
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