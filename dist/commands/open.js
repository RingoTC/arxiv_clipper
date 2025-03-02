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
async function openPaperDirectory(arxivId, options = {}) {
    try {
        // Get paper from database
        const papers = await Paper_1.paperDB.searchPapers(arxivId);
        if (papers.length === 0) {
            console.error(chalk_1.default.red(`Paper with ID ${arxivId} not found.`));
            return;
        }
        const paper = papers[0];
        // Determine which path to open
        let pathToOpen;
        if (options.type === 'github') {
            if (!paper.localGithubPath) {
                console.error(chalk_1.default.red(`No GitHub repository found for paper ${paper.title}.`));
                return;
            }
            pathToOpen = paper.localGithubPath;
        }
        else if (options.type === 'source') {
            if (!paper.localSourcePath) {
                console.error(chalk_1.default.red(`No source files found for paper ${paper.title}.`));
                return;
            }
            // Extract source files if they haven't been extracted yet
            const sourceDir = path_1.default.join(path_1.default.dirname(paper.localSourcePath), 'source');
            if (!fs_extra_1.default.existsSync(sourceDir)) {
                console.log(chalk_1.default.blue(`Extracting source files for ${paper.title}...`));
                await fs_extra_1.default.ensureDir(sourceDir);
                await fs_extra_1.default.exec(`tar -xzf "${paper.localSourcePath}" -C "${sourceDir}"`);
            }
            pathToOpen = sourceDir;
        }
        else if (options.type === 'parent') {
            // Open the parent directory containing both source and GitHub
            if (paper.localPdfPath) {
                pathToOpen = path_1.default.dirname(paper.localPdfPath);
            }
            else {
                console.error(chalk_1.default.red(`No local files found for paper ${paper.title}.`));
                return;
            }
        }
        else {
            // Default to parent directory
            if (paper.localPdfPath) {
                pathToOpen = path_1.default.dirname(paper.localPdfPath);
            }
            else {
                console.error(chalk_1.default.red(`No local files found for paper ${paper.title}.`));
                return;
            }
        }
        if (pathToOpen) {
            console.log(chalk_1.default.green(`Opening ${options.type || 'parent'} directory for ${paper.title}...`));
            await (0, open_1.default)(pathToOpen, { wait: false });
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
        .option('--github', 'Open the GitHub repository directory')
        .option('--source', 'Open the LaTeX source directory')
        .option('--parent', 'Open the parent directory (default)')
        .action((arxivId, options) => {
        let type;
        if (options.github) {
            type = 'github';
        }
        else if (options.source) {
            type = 'source';
        }
        else if (options.parent) {
            type = 'parent';
        }
        openPaperDirectory(arxivId, { type });
    });
    program
        .command('open-kb')
        .description('Open the entire arXiv knowledge base directory')
        .action(() => {
        openKnowledgeBase();
    });
};
exports.default = openCommand;
