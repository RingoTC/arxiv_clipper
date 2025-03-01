#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const packageJson = __importStar(require("../package.json"));
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
// Handle direct URL input (default to download command)
program
    .arguments('[url]')
    .option('-t, --tag <tag>', 'Tag for organizing papers', 'default')
    .action(async (url, options) => {
    if (url && url.includes('arxiv.org')) {
        // If URL is provided, call the download command
        const downloadCmd = program.commands.find(cmd => cmd.name() === 'download');
        if (downloadCmd) {
            // Call the download command directly
            program.parse(['node', 'script.js', 'download', url, ...((options === null || options === void 0 ? void 0 : options.tag) ? ['-t', options.tag] : [])]);
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
