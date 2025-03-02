"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const Paper_1 = require("../models/Paper");
const bibtexCommand = (program) => {
    program
        .command('bibtex [searchTerms...]')
        .description('Export BibTeX citations for papers')
        .option('-t, --tag <tag>', 'Filter papers by tag')
        .option('-a, --all', 'Export all papers without filtering', false)
        .option('-o, --output <file>', 'Output to file instead of console')
        .action(async (searchTerms, options) => {
        try {
            let result;
            if (options.all) {
                // Get all papers
                result = await Paper_1.paperDB.getAllPaginated(1, 1000); // Get a large number of papers
            }
            else if (options.tag) {
                // Get papers by tag
                result = await Paper_1.paperDB.getByTagPaginated(options.tag, 1, 1000);
            }
            else if (searchTerms.length > 0) {
                // Search papers by keywords
                result = await Paper_1.paperDB.searchPapers(searchTerms);
            }
            else {
                console.log(chalk_1.default.yellow('Please specify search terms, a tag with -t, or use --all for all papers.'));
                return;
            }
            if (result.papers.length === 0) {
                console.log(chalk_1.default.yellow('No papers found.'));
                return;
            }
            // Collect BibTeX entries
            const bibtexEntries = [];
            result.papers.forEach(paper => {
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
