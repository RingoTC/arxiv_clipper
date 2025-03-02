#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const logger_1 = require("./utils/logger");
const packageJson = require('../package.json');
// Import commands
const download_1 = __importDefault(require("./commands/download"));
const list_1 = __importDefault(require("./commands/list"));
const delete_1 = __importDefault(require("./commands/delete"));
const source_1 = __importDefault(require("./commands/source"));
const pdf_1 = __importDefault(require("./commands/pdf"));
const clean_1 = __importDefault(require("./commands/clean"));
const bibtex_1 = __importDefault(require("./commands/bibtex"));
const bibtex_web_1 = __importDefault(require("./commands/bibtex-web"));
const open_1 = __importDefault(require("./commands/open"));
const migrate_1 = __importDefault(require("./commands/migrate"));
// Generate a trace ID for this CLI session
const sessionTraceId = (0, logger_1.generateTraceId)();
(0, logger_1.setTraceId)(sessionTraceId);
// Log startup
logger_1.logger.info(`Starting arXiv Downloader CLI v${packageJson.version}`, {
    version: packageJson.version,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
});
// Set up CLI
const program = new commander_1.Command();
program
    .name('adown')
    .description('A command-line tool for downloading and managing arXiv papers')
    .version(packageJson.version);
// Register commands
(0, download_1.default)(program);
(0, list_1.default)(program);
(0, delete_1.default)(program);
(0, source_1.default)(program);
(0, pdf_1.default)(program);
(0, clean_1.default)(program);
(0, bibtex_1.default)(program);
(0, bibtex_web_1.default)(program);
(0, open_1.default)(program);
(0, migrate_1.default)(program);
// Handle direct URL input (default to download command)
program
    .arguments('[url]')
    .option('-t, --tag <tag>', 'Tag for organizing papers', 'default')
    .option('--github <url>', 'GitHub repository URL to download along with the paper')
    .action(async (url, options) => {
    if (url && url.includes('arxiv.org')) {
        // If URL is provided, call the download command
        logger_1.logger.info('Direct URL input detected, calling download command', { url, options });
        const downloadCmd = program.commands.find(cmd => cmd.name() === 'download');
        if (downloadCmd) {
            // Call the download command directly
            const args = ['node', 'script.js', 'download', url];
            if (options?.tag)
                args.push('-t', options.tag);
            if (options?.github)
                args.push('--github', options.github);
            program.parse(args);
        }
    }
    else if (!process.argv.slice(2).length || (url && !url.includes('arxiv.org'))) {
        // Show help if no arguments or invalid URL
        logger_1.logger.info('No arguments or invalid URL, showing help');
        program.outputHelp();
    }
});
// Handle unknown commands
program.on('command:*', () => {
    const command = program.args.join(' ');
    logger_1.logger.error(`Invalid command: ${command}`);
    console.error(chalk_1.default.red(`Invalid command: ${command}`));
    console.log(`See ${chalk_1.default.blue('--help')} for a list of available commands.`);
    process.exit(1);
});
// Log command execution
const originalParse = program.parse;
program.parse = function (argv) {
    if (argv && argv.length > 2) {
        const command = argv.slice(2).join(' ');
        if (command) {
            logger_1.logger.info(`Executing command: ${command}`, { command, args: argv.slice(2) });
        }
    }
    return originalParse.call(this, argv);
};
// Handle errors
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught exception', { error: error.message, stack: error.stack });
    console.error(chalk_1.default.red('Error:'), error.message);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled rejection', { reason: String(reason) });
    console.error(chalk_1.default.red('Unhandled rejection:'), reason);
    process.exit(1);
});
// Parse arguments
program.parse(process.argv);
