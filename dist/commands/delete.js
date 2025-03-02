"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteItems = deleteItems;
const Paper_1 = require("../models/Paper");
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
async function deleteItems(keywords, options) {
    try {
        if (options.tag) {
            await Paper_1.paperDB.deleteByTag(options.tag);
            console.log(chalk_1.default.green(`Successfully deleted all papers with tag: ${options.tag}`));
            return;
        }
        const papers = await Paper_1.paperDB.searchPapers(keywords);
        if (papers.length === 0) {
            console.log(chalk_1.default.yellow('No papers found to delete.'));
            return;
        }
        const choices = papers.map((paper, index) => ({
            name: `${index + 1}. ${paper.title} (${paper.arxivId || paper.id})`,
            value: paper.id
        }));
        const { selectedPapers } = await inquirer_1.default.prompt([{
                type: 'checkbox',
                name: 'selectedPapers',
                message: 'Select papers to delete:',
                choices,
                default: [choices[0].value]
            }]);
        if (selectedPapers.length === 0) {
            console.log(chalk_1.default.yellow('No papers selected for deletion.'));
            return;
        }
        // Delete files
        for (const paper of papers.filter(p => selectedPapers.includes(p.id))) {
            try {
                if (paper.pdfPath && (0, fs_1.existsSync)(paper.pdfPath)) {
                    await (0, promises_1.unlink)(paper.pdfPath);
                }
                if (paper.sourcePath && (0, fs_1.existsSync)(paper.sourcePath)) {
                    await (0, promises_1.unlink)(paper.sourcePath);
                }
            }
            catch (error) {
                console.warn(chalk_1.default.yellow(`Warning: Could not delete some files for paper: ${paper.title}`));
            }
        }
        // Delete from database
        await Paper_1.paperDB.deletePapers(selectedPapers);
        console.log(chalk_1.default.green('Successfully deleted selected papers.'));
    }
    catch (error) {
        console.error(chalk_1.default.red('Failed to delete papers:'), error);
    }
}
const deleteCommand = (program) => {
    program
        .command('delete [keywords...]')
        .description('Delete papers from the database')
        .option('-t, --tag <tag>', 'Delete all papers with a specific tag')
        .action((keywords, options) => {
        deleteItems(keywords, options);
    });
};
exports.default = deleteCommand;
