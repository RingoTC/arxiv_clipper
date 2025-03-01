"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const inquirer_1 = __importDefault(require("inquirer"));
const database_1 = require("../utils/database");
const deleteCommand = (program) => {
    program
        .command('delete [searchTerms...]')
        .description('Delete papers')
        .option('-t, --tag <tag>', 'Delete all papers with a specific tag')
        .option('-f, --force', 'Force delete without confirmation', false)
        .action(async (searchTerms, options) => {
        try {
            let papers = [];
            // Determine which papers to delete
            if (options.tag) {
                papers = (0, database_1.findPapersByTag)(options.tag);
                console.log(chalk_1.default.blue(`Finding papers with tag: ${options.tag}`));
            }
            else if (searchTerms.length > 0) {
                papers = (0, database_1.findPapers)(searchTerms);
                console.log(chalk_1.default.blue(`Finding papers matching: ${searchTerms.join(' ')}`));
            }
            else {
                console.log(chalk_1.default.yellow('Please specify search terms or a tag to delete papers.'));
                return;
            }
            if (papers.length === 0) {
                console.log(chalk_1.default.yellow('No papers found.'));
                return;
            }
            // Display papers to be deleted
            console.log(chalk_1.default.gray(`Found ${papers.length} papers to delete:`));
            console.log();
            papers.forEach((paper, index) => {
                console.log(chalk_1.default.red(`${index + 1}. ${paper.title || 'Untitled'}`));
                // Display authors
                if (paper.authors && paper.authors.length > 0) {
                    const authorText = paper.authors.join(', ');
                    console.log(chalk_1.default.gray(`   Authors: ${authorText}`));
                }
                // Display tag
                console.log(chalk_1.default.gray(`   Tag: ${paper.tag || 'default'}`));
                // Display ID
                console.log(chalk_1.default.gray(`   ID: ${paper.id}`));
                console.log(); // Add a blank line between papers
            });
            // Confirm deletion
            let shouldDelete = options.force;
            if (!shouldDelete) {
                const answers = await inquirer_1.default.prompt([
                    {
                        type: 'confirm',
                        name: 'confirm',
                        message: chalk_1.default.red(`Are you sure you want to delete these ${papers.length} papers?`),
                        default: false
                    }
                ]);
                shouldDelete = answers.confirm;
            }
            if (!shouldDelete) {
                console.log(chalk_1.default.yellow('Operation cancelled.'));
                return;
            }
            // Delete papers
            const paperIds = papers.map(paper => paper.id);
            // Delete files
            papers.forEach(paper => {
                // Get the directory containing the paper files
                const paperDir = paper.pdfPath ? paper.pdfPath.replace('/paper.pdf', '') : null;
                if (paperDir && fs_extra_1.default.existsSync(paperDir)) {
                    fs_extra_1.default.removeSync(paperDir);
                    console.log(chalk_1.default.gray(`Removed directory: ${paperDir}`));
                }
            });
            // Delete from database
            (0, database_1.deletePapers)(paperIds);
            console.log(chalk_1.default.green(`Successfully deleted ${papers.length} papers.`));
        }
        catch (error) {
            console.error(chalk_1.default.red(`Error: ${error.message}`));
            process.exit(1);
        }
    });
};
exports.default = deleteCommand;
