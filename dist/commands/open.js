"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openPaperDirectory = openPaperDirectory;
exports.openKnowledgeBase = openKnowledgeBase;
const Paper_1 = require("../models/Paper");
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const open_1 = __importDefault(require("open"));
const os_1 = require("os");
async function openPaperDirectory(id, options = {}) {
    try {
        // Search for the paper
        const result = await Paper_1.paperDB.searchPapers(id);
        if (result.papers.length === 0) {
            console.log(chalk_1.default.yellow(`No paper found with ID: ${id}`));
            return;
        }
        const paper = result.papers[0];
        let dirToOpen;
        if (options.source && paper.localSourcePath) {
            // Open source directory
            dirToOpen = paper.localSourcePath;
            console.log(chalk_1.default.green(`Opening source directory for paper: ${paper.title}`));
        }
        else if (options.github && paper.localGithubPath) {
            // Open GitHub repository directory
            dirToOpen = paper.localGithubPath;
            console.log(chalk_1.default.green(`Opening GitHub repository for paper: ${paper.title}`));
        }
        else if (paper.localPdfPath) {
            // Open parent directory
            dirToOpen = path_1.default.dirname(paper.localPdfPath);
            console.log(chalk_1.default.green(`Opening directory for paper: ${paper.title}`));
        }
        else {
            console.log(chalk_1.default.yellow(`No local files found for paper: ${paper.title}`));
            return;
        }
        // Open the directory
        await (0, open_1.default)(dirToOpen);
    }
    catch (error) {
        console.error(chalk_1.default.red('Failed to open paper directory:'), error);
    }
}
// Open the entire knowledge base
async function openKnowledgeBase() {
    try {
        const kbPath = path_1.default.join((0, os_1.homedir)(), 'Development', 'arxiv');
        console.log(chalk_1.default.green(`Opening knowledge base at: ${kbPath}`));
        await (0, open_1.default)(kbPath);
    }
    catch (error) {
        console.error(chalk_1.default.red('Failed to open knowledge base:'), error);
    }
}
const openCommand = (program) => {
    program
        .command('open [id]')
        .description('Open the directory containing a paper')
        .option('-s, --source', 'Open the LaTeX source directory')
        .option('-g, --github', 'Open the GitHub repository directory')
        .action((id, options) => {
        if (id) {
            openPaperDirectory(id, options);
        }
        else {
            console.log(chalk_1.default.yellow('Please provide a paper ID.'));
        }
    });
    program
        .command('open-kb')
        .description('Open the knowledge base directory')
        .action(() => {
        openKnowledgeBase();
    });
};
exports.default = openCommand;
