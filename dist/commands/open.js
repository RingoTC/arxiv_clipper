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
const fs_extra_1 = __importDefault(require("fs-extra"));
async function openPaperDirectory(arxivId) {
    try {
        // Get paper from database
        const papers = await Paper_1.paperDB.searchPapers(arxivId);
        if (papers.length === 0) {
            console.error(chalk_1.default.red(`Paper with ID ${arxivId} not found.`));
            return;
        }
        const paper = papers[0];
        // Open the parent directory containing all files
        if (paper.localPdfPath) {
            const pathToOpen = path_1.default.dirname(paper.localPdfPath);
            console.log(chalk_1.default.green(`Opening directory for ${paper.title}...`));
            await (0, open_1.default)(pathToOpen, { wait: false });
        }
        else {
            console.error(chalk_1.default.red(`No local files found for paper ${paper.title}.`));
            return;
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('Failed to open directory:'), error);
    }
}
// Open the entire knowledge base
async function openKnowledgeBase() {
    try {
        const knowledgeBasePath = path_1.default.join(process.env.HOME || process.env.USERPROFILE || '', 'Development', 'arxiv');
        if (!fs_extra_1.default.existsSync(knowledgeBasePath)) {
            console.error(chalk_1.default.red(`Knowledge base directory not found at ${knowledgeBasePath}.`));
            return;
        }
        console.log(chalk_1.default.green(`Opening arXiv knowledge base...`));
        await (0, open_1.default)(knowledgeBasePath, { wait: false });
    }
    catch (error) {
        console.error(chalk_1.default.red('Failed to open knowledge base:'), error);
    }
}
const openCommand = (program) => {
    program
        .command('open <arxivId>')
        .description('Open the directory containing paper files')
        .action((arxivId) => {
        openPaperDirectory(arxivId);
    });
    program
        .command('open-kb')
        .description('Open the entire arXiv knowledge base directory')
        .action(() => {
        openKnowledgeBase();
    });
};
exports.default = openCommand;
