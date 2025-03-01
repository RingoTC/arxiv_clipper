"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const database_1 = require("../utils/database");
const listCommand = (program) => {
    program
        .command('list [searchTerms...]')
        .alias('ls')
        .description('List downloaded papers')
        .option('-t, --tag <tag>', 'Filter papers by tag')
        .action((searchTerms, options) => {
        try {
            let papers = [];
            // If tag is provided, filter by tag
            if (options.tag) {
                papers = (0, database_1.findPapersByTag)(options.tag);
                console.log(chalk_1.default.blue(`Listing papers with tag: ${options.tag}`));
            }
            else {
                // Otherwise, search by terms if provided
                papers = (0, database_1.findPapers)(searchTerms);
                if (searchTerms.length > 0) {
                    console.log(chalk_1.default.blue(`Searching for papers matching: ${searchTerms.join(' ')}`));
                }
                else {
                    console.log(chalk_1.default.blue('Listing all papers'));
                }
            }
            if (papers.length === 0) {
                console.log(chalk_1.default.yellow('No papers found.'));
                return;
            }
            // Display papers
            console.log(chalk_1.default.gray(`Found ${papers.length} papers:`));
            console.log();
            papers.forEach((paper, index) => {
                console.log(chalk_1.default.green(`${index + 1}. ${paper.title || 'Untitled'}`));
                // Display authors
                if (paper.authors && paper.authors.length > 0) {
                    const authorText = paper.authors.join(', ');
                    console.log(chalk_1.default.gray(`   Authors: ${authorText}`));
                }
                // Display tag
                console.log(chalk_1.default.gray(`   Tag: ${paper.tag || 'default'}`));
                // Display ID and URL
                console.log(chalk_1.default.gray(`   ID: ${paper.id}`));
                console.log(chalk_1.default.gray(`   URL: ${paper.url}`));
                // Display download date
                if (paper.downloadDate) {
                    const date = new Date(paper.downloadDate);
                    console.log(chalk_1.default.gray(`   Downloaded: ${date.toLocaleDateString()}`));
                }
                console.log(); // Add a blank line between papers
            });
        }
        catch (error) {
            console.error(chalk_1.default.red(`Error: ${error.message}`));
            process.exit(1);
        }
    });
};
exports.default = listCommand;
