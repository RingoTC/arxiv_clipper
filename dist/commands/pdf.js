"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openPdf = openPdf;
const Paper_1 = require("../models/Paper");
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
async function openPdf(keywords, options) {
    try {
        console.log('Searching for papers with keywords:', keywords);
        const papers = await Paper_1.paperDB.searchPapers(keywords);
        console.log('Search results:', papers);
        if (papers.length === 0) {
            console.log(chalk_1.default.yellow('No papers found.'));
            return;
        }
        const choices = papers.map((paper, index) => ({
            name: `${index + 1}. ${paper.title} (${paper.arxivId || paper.id})`,
            value: paper.localPdfPath || paper.pdfPath
        }));
        const { selectedPdf } = await inquirer_1.default.prompt([{
                type: 'list',
                name: 'selectedPdf',
                message: 'Select a paper to open PDF:',
                choices,
                default: choices[0].value
            }]);
        if (!selectedPdf) {
            console.log(chalk_1.default.yellow('No PDF selected.'));
            return;
        }
        // Open PDF with default application
        (0, child_process_1.exec)(`open "${selectedPdf}"`, (error) => {
            if (error) {
                console.error(chalk_1.default.red('Failed to open PDF:'), error);
            }
        });
    }
    catch (error) {
        console.error(chalk_1.default.red('Failed to open PDF:'), error);
    }
}
const pdfCommand = (program) => {
    program
        .command('pdf [keywords...]')
        .description('Open a paper PDF')
        .option('-t, --tag <tag>', 'Filter papers by tag')
        .action((keywords, options) => {
        openPdf(keywords, options);
    });
};
exports.default = pdfCommand;
