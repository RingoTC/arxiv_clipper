"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPapers = listPapers;
const Paper_1 = require("../models/Paper");
const chalk_1 = __importDefault(require("chalk"));
async function listPapers(keywords, options) {
    try {
        const papers = await Paper_1.paperDB.searchPapers(keywords, options.tag);
        if (papers.length === 0) {
            console.log(chalk_1.default.yellow('No papers found.'));
            return;
        }
        console.log(chalk_1.default.bold(`Found ${papers.length} papers:`));
        papers.forEach((paper, index) => {
            console.log(chalk_1.default.blue(`\n${index + 1}. ${paper.title}`));
            console.log(chalk_1.default.gray(`   Authors: ${paper.authors}`));
            console.log(chalk_1.default.gray(`   ArXiv ID: ${paper.arxivId || paper.id}`));
            console.log(chalk_1.default.gray(`   Tag: ${paper.tag || 'none'}`));
            if (paper.abstract) {
                console.log(chalk_1.default.gray(`   Abstract: ${paper.abstract.substring(0, 150)}...`));
            }
        });
    }
    catch (error) {
        console.error(chalk_1.default.red('Failed to list papers:'), error);
    }
}
const listCommand = (program) => {
    program
        .command('list [keywords...]')
        .description('List downloaded papers')
        .option('-t, --tag <tag>', 'Filter papers by tag')
        .action((keywords, options) => {
        listPapers(keywords, options);
    });
};
exports.default = listCommand;
