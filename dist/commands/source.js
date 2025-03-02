"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openSource = openSource;
exports.extractSource = extractSource;
exports.extractSourceInteractive = extractSourceInteractive;
const Paper_1 = require("../models/Paper");
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function openSource(keywords, options) {
    try {
        const result = await Paper_1.paperDB.searchPapers(keywords);
        if (result.papers.length === 0) {
            console.log(chalk_1.default.yellow('No papers found.'));
            return;
        }
        const choices = result.papers.map((paper, index) => ({
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
async function extractSource(id) {
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
        // Create source directory
        const pdfDir = path_1.default.dirname(paper.localPdfPath);
        const sourceDir = path_1.default.join(pdfDir, 'source');
        await fs_extra_1.default.ensureDir(sourceDir);
        // Extract source
        console.log(chalk_1.default.green(`Extracting LaTeX source for paper: ${paper.title}`));
        // Check if source URL exists
        if (paper.sourceUrl) {
            // Download source from arXiv
            console.log(chalk_1.default.blue(`Downloading source from: ${paper.sourceUrl}`));
            await execAsync(`curl -L "${paper.sourceUrl}" -o "${path_1.default.join(sourceDir, 'source.tar.gz')}"`);
            // Extract the tar.gz file
            console.log(chalk_1.default.blue('Extracting source files...'));
            await execAsync(`tar -xzf "${path_1.default.join(sourceDir, 'source.tar.gz')}" -C "${sourceDir}"`);
            // Update paper with source path
            paper.localSourcePath = sourceDir;
            await Paper_1.paperDB.add(paper);
            console.log(chalk_1.default.green('Source extraction complete!'));
            console.log(chalk_1.default.blue(`Source files are available at: ${sourceDir}`));
        }
        else {
            console.log(chalk_1.default.yellow('No source URL available for this paper.'));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('Failed to extract source:'), error);
    }
}
async function extractSourceInteractive() {
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
                message: 'Select a paper to extract source:',
                choices
            }
        ]);
        if (selectedPaper === 'cancel') {
            console.log(chalk_1.default.blue('Operation cancelled.'));
            return;
        }
        // Extract source for the selected paper
        await extractSource(selectedPaper);
    }
    catch (error) {
        console.error(chalk_1.default.red('Failed to extract source:'), error);
    }
}
const sourceCommand = (program) => {
    program
        .command('source [id]')
        .description('Extract LaTeX source for a paper')
        .action((id) => {
        if (id) {
            extractSource(id);
        }
        else {
            extractSourceInteractive();
        }
    });
};
exports.default = sourceCommand;
