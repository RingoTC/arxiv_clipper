#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const packageJson = require('../package.json');
// Import commands
const download_1 = __importDefault(require("./commands/download"));
// @ts-ignore
const list_1 = __importDefault(require("./commands/list"));
// @ts-ignore
const delete_1 = __importDefault(require("./commands/delete"));
// @ts-ignore
const source_1 = __importDefault(require("./commands/source"));
// @ts-ignore
const pdf_1 = __importDefault(require("./commands/pdf"));
// @ts-ignore
const clean_1 = __importDefault(require("./commands/clean"));
// @ts-ignore
const bibtex_1 = __importDefault(require("./commands/bibtex"));
// @ts-ignore
const bibtex_web_1 = __importDefault(require("./commands/bibtex-web"));
// @ts-ignore
const open_1 = __importDefault(require("./commands/open"));
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
// Handle direct URL input (default to download command)
program
    .arguments('[url]')
    .option('-t, --tag <tag>', 'Tag for organizing papers', 'default')
    .option('--github <url>', 'GitHub repository URL to download along with the paper')
    .action(async (url, options) => {
    if (url && url.includes('arxiv.org')) {
        // If URL is provided, call the download command
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
        program.outputHelp();
    }
});
// Handle unknown commands
program.on('command:*', () => {
    console.error(chalk_1.default.red(`Invalid command: ${program.args.join(' ')}`));
    console.log(`See ${chalk_1.default.blue('--help')} for a list of available commands.`);
    process.exit(1);
});
// Parse arguments
program.parse(process.argv);
