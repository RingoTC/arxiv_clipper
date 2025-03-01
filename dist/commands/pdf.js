"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const database_1 = require("../utils/database");
const pdfCommand = (program) => {
    program
        .command('pdf [searchTerms...]')
        .description('Open PDF of a paper')
        .action((searchTerms, options) => {
        try {
            if (searchTerms.length === 0) {
                console.log(chalk_1.default.yellow('Please specify search terms to find a paper.'));
                return;
            }
            // Find papers matching search terms
            const papers = (0, database_1.findPapers)(searchTerms);
            if (papers.length === 0) {
                console.log(chalk_1.default.yellow('No papers found.'));
                return;
            }
            if (papers.length > 1) {
                console.log(chalk_1.default.yellow('Multiple papers found. Please refine your search.'));
                console.log(chalk_1.default.gray('Matching papers:'));
                papers.forEach((paper, index) => {
                    console.log(chalk_1.default.gray(`${index + 1}. ${paper.title || 'Untitled'}`));
                });
                return;
            }
            const paper = papers[0];
            if (!paper.pdfPath) {
                console.log(chalk_1.default.yellow('No PDF found for this paper.'));
                return;
            }
            console.log(chalk_1.default.blue(`Opening PDF for: ${paper.title || 'Untitled'}`));
            // Open PDF
            const command = process.platform === 'darwin'
                ? `open "${paper.pdfPath}"`
                : process.platform === 'win32'
                    ? `start "" "${paper.pdfPath}"`
                    : `xdg-open "${paper.pdfPath}"`;
            (0, child_process_1.exec)(command, (error) => {
                if (error) {
                    console.error(chalk_1.default.red(`Error opening PDF: ${error.message}`));
                    return;
                }
                console.log(chalk_1.default.green('PDF opened successfully.'));
            });
        }
        catch (error) {
            console.error(chalk_1.default.red(`Error: ${error.message}`));
            process.exit(1);
        }
    });
};
exports.default = pdfCommand;
