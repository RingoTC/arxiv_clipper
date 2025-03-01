"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const database_1 = require("../utils/database");
const bibtexCommand = (program) => {
    program
        .command('bibtex [searchTerms...]')
        .description('Export BibTeX citations for papers')
        .option('-t, --tag <tag>', 'Filter papers by tag')
        .option('-a, --all', 'Export all papers without filtering', false)
        .option('-o, --output <file>', 'Output to file instead of console')
        .action((searchTerms, options) => {
        try {
            let papers = [];
            // Determine which papers to include
            if (options.all) {
                papers = (0, database_1.findPapers)([]);
                console.log(chalk_1.default.blue('Exporting BibTeX for all papers'));
            }
            else if (options.tag) {
                papers = (0, database_1.findPapersByTag)(options.tag);
                console.log(chalk_1.default.blue(`Exporting BibTeX for papers with tag: ${options.tag}`));
            }
            else if (searchTerms.length > 0) {
                papers = (0, database_1.findPapers)(searchTerms);
                console.log(chalk_1.default.blue(`Exporting BibTeX for papers matching: ${searchTerms.join(' ')}`));
            }
            else {
                console.log(chalk_1.default.yellow('Please specify search terms, a tag, or use --all to export all papers.'));
                return;
            }
            if (papers.length === 0) {
                console.log(chalk_1.default.yellow('No papers found.'));
                return;
            }
            // Collect BibTeX entries
            const bibtexEntries = [];
            papers.forEach(paper => {
                if (paper.bibtex) {
                    bibtexEntries.push(paper.bibtex);
                }
            });
            if (bibtexEntries.length === 0) {
                console.log(chalk_1.default.yellow('No BibTeX entries found for the selected papers.'));
                return;
            }
            const combinedBibtex = bibtexEntries.join('\n\n');
            // Output to file or console
            if (options.output) {
                fs_extra_1.default.writeFileSync(options.output, combinedBibtex);
                console.log(chalk_1.default.green(`BibTeX exported to ${options.output}`));
            }
            else {
                console.log('\n' + combinedBibtex);
                console.log(chalk_1.default.gray(`\nExported ${bibtexEntries.length} BibTeX entries.`));
            }
        }
        catch (error) {
            console.error(chalk_1.default.red(`Error: ${error.message}`));
            process.exit(1);
        }
    });
};
exports.default = bibtexCommand;
