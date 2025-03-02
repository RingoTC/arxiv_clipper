"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteItems = deleteItems;
exports.deletePaper = deletePaper;
exports.deleteInteractive = deleteInteractive;
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
        const result = await Paper_1.paperDB.searchPapers(keywords);
        if (result.papers.length === 0) {
            console.log(chalk_1.default.yellow('No papers found to delete.'));
            return;
        }
        const choices = result.papers.map((paper, index) => ({
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
        for (const paperId of selectedPapers) {
            const paper = result.papers.find(p => p.id === paperId);
            if (paper) {
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
        }
        // Delete from database
        await Paper_1.paperDB.deletePapers(selectedPapers);
        console.log(chalk_1.default.green('Successfully deleted selected papers.'));
    }
    catch (error) {
        console.error(chalk_1.default.red('Failed to delete papers:'), error);
    }
}
async function deletePaper(id) {
    try {
        // Search for the paper
        const result = await Paper_1.paperDB.searchPapers(id);
        if (result.papers.length === 0) {
            console.log(chalk_1.default.yellow(`No paper found with ID: ${id}`));
            return;
        }
        // Delete the paper
        await Paper_1.paperDB.delete(id);
        console.log(chalk_1.default.green(`Paper deleted: ${id}`));
    }
    catch (error) {
        console.error(chalk_1.default.red('Failed to delete paper:'), error);
    }
}
async function deleteInteractive() {
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
        // Prompt user to select papers to delete
        const { selectedPapers } = await inquirer_1.default.prompt([
            {
                type: 'checkbox',
                name: 'selectedPapers',
                message: 'Select papers to delete:',
                choices
            }
        ]);
        if (selectedPapers.includes('cancel') || selectedPapers.length === 0) {
            console.log(chalk_1.default.blue('No papers selected for deletion.'));
            return;
        }
        // Delete selected papers
        for (const paperId of selectedPapers) {
            if (paperId !== 'cancel') {
                await Paper_1.paperDB.delete(paperId);
                const paper = result.papers.find(p => p.id === paperId);
                if (paper) {
                    console.log(chalk_1.default.green(`Paper deleted: ${paper.title} (${paper.id})`));
                }
            }
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('Failed to delete papers:'), error);
    }
}
const deleteCommand = (program) => {
    program
        .command('delete [id]')
        .description('Delete a paper by ID or interactively')
        .action((id) => {
        if (id) {
            deletePaper(id);
        }
        else {
            deleteInteractive();
        }
    });
};
exports.default = deleteCommand;
