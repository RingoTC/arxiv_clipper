"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openSource = openSource;
const Paper_1 = require("../models/Paper");
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
async function openSource(keywords, options) {
    try {
        const papers = await Paper_1.paperDB.searchPapers(keywords);
        if (papers.length === 0) {
            console.log(chalk_1.default.yellow('No papers found.'));
            return;
        }
        const choices = papers.map((paper, index) => ({
            name: `${index + 1}. ${paper.title} (${paper.arxivId || paper.id})`,
            value: paper.sourcePath
        }));
        const { selectedSource } = await inquirer_1.default.prompt([{
                type: 'list',
                name: 'selectedSource',
                message: 'Select a paper to open source:',
                choices,
                default: choices[0].value
            }]);
        if (!selectedSource) {
            console.log(chalk_1.default.yellow('No source selected.'));
            return;
        }
        // Open source with default application
        (0, child_process_1.exec)(`open "${selectedSource}"`, (error) => {
            if (error) {
                console.error(chalk_1.default.red('Failed to open source:'), error);
            }
        });
    }
    catch (error) {
        console.error(chalk_1.default.red('Failed to open source:'), error);
    }
}
const sourceCommand = (program) => {
    program
        .command('source [keywords...]')
        .description('Open a paper source')
        .option('-t, --tag <tag>', 'Filter papers by tag')
        .action((keywords, options) => {
        openSource(keywords, options);
    });
};
exports.default = sourceCommand;
