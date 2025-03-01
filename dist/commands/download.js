"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const arxiv_1 = require("../utils/arxiv");
const database_1 = require("../utils/database");
const downloadCommand = (program) => {
    program
        .command('download <url>')
        .alias('d')
        .description('Download a paper from arXiv')
        .option('-t, --tag <tag>', 'Tag for organizing papers', 'default')
        .action(async (url, options) => {
        try {
            console.log(chalk_1.default.blue('Downloading paper...'));
            // Extract arXiv ID from URL
            const arxivId = (0, arxiv_1.extractArxivId)(url);
            console.log(chalk_1.default.gray(`ArXiv ID: ${arxivId}`));
            // Get paper metadata
            console.log(chalk_1.default.gray('Fetching paper metadata...'));
            const paper = await (0, arxiv_1.getPaperMetadata)(arxivId);
            // Use the tag from options object
            const tag = options.tag || 'default';
            console.log(chalk_1.default.gray(`Using tag: ${tag}`));
            const paperDir = (0, arxiv_1.createPaperDirectory)(paper, tag);
            console.log(chalk_1.default.gray(`Created directory: ${paperDir}`));
            // Download PDF
            console.log(chalk_1.default.gray('Downloading PDF...'));
            const pdfPath = await (0, arxiv_1.downloadPdf)(arxivId, paperDir);
            // Download source files
            console.log(chalk_1.default.gray('Downloading source files...'));
            const sourcePath = await (0, arxiv_1.downloadSource)(arxivId, paperDir);
            // Get and save BibTeX
            console.log(chalk_1.default.gray('Fetching BibTeX citation...'));
            const bibtex = await (0, arxiv_1.getBibTeX)(arxivId);
            const bibtexPath = await (0, arxiv_1.saveBibTeX)(bibtex, paperDir);
            // Add paper to database
            const paperWithTag = {
                ...paper,
                tag,
                pdfPath,
                sourcePath,
                bibtexPath,
                bibtex,
                downloadDate: new Date().toISOString()
            };
            (0, database_1.addPaper)(paperWithTag);
            console.log(chalk_1.default.green(`\nSuccessfully downloaded paper: ${paper.title || 'Untitled'}`));
            console.log(chalk_1.default.gray(`PDF: ${pdfPath}`));
            console.log(chalk_1.default.gray(`Source: ${sourcePath}`));
            console.log(chalk_1.default.gray(`BibTeX: ${bibtexPath}`));
        }
        catch (error) {
            console.error(chalk_1.default.red(`Error: ${error.message}`));
            process.exit(1);
        }
    });
};
exports.default = downloadCommand;
