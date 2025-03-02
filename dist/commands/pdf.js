"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openPdf = openPdf;
exports.openPdfInteractive = openPdfInteractive;
const Paper_1 = require("../models/Paper");
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const open_1 = __importDefault(require("open"));
async function openPdf(id) {
    try {
        // Search for the paper
        const result = await Paper_1.paperDB.searchPapers(id);
        if (result.papers.length === 0) {
            console.log(chalk_1.default.yellow(`No paper found with ID: ${id}`));
            return;
        }
        const paper = result.papers[0];
        if (!paper.localPdfPath) {
            console.log(chalk_1.default.yellow(`No PDF found for paper: ${paper.title}`));
            return;
        }
        // Open the PDF
        console.log(chalk_1.default.green(`Opening PDF for paper: ${paper.title}`));
        await (0, open_1.default)(paper.localPdfPath);
    }
    catch (error) {
        console.error(chalk_1.default.red('Failed to open PDF:'), error);
    }
}
async function openPdfInteractive() {
    try {
        // Get all papers
        const result = await Paper_1.paperDB.getAllPaginated(1, 1000); // Get a large number of papers
        if (result.papers.length === 0) {
            console.log(chalk_1.default.yellow('No papers found.'));
            return;
        }
        // Create choices for inquirer
        const choices = result.papers.map((paper, index) => ({
            name: `${index + 1}. ${paper.title} (${paper.id})`,
            value: paper.id
        }));
        // Add a "Cancel" option
        choices.push({
            name: 'Cancel',
            value: 'cancel'
        });
        // Prompt user to select a paper
        const { selectedPaper } = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'selectedPaper',
                message: 'Select a paper to open:',
                choices
            }
        ]);
        if (selectedPaper === 'cancel') {
            console.log(chalk_1.default.blue('Operation cancelled.'));
            return;
        }
        // Open the selected paper
        await openPdf(selectedPaper);
    }
    catch (error) {
        console.error(chalk_1.default.red('Failed to open PDF:'), error);
    }
}
const pdfCommand = (program) => {
    program
        .command('pdf [id]')
        .description('Open a paper PDF')
        .action((id) => {
        if (id) {
            openPdf(id);
        }
        else {
            openPdfInteractive();
        }
    });
};
exports.default = pdfCommand;
