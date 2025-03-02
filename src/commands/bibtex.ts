import chalk from 'chalk';
import fs from 'fs-extra';
import { Command } from 'commander';
import { paperDB } from '../models/Paper';
import { CommandFunction, CommandOptions, Paper, PaginatedResult } from '../types';

const bibtexCommand: CommandFunction = (program: Command) => {
  program
    .command('bibtex [searchTerms...]')
    .description('Export BibTeX citations for papers')
    .option('-t, --tag <tag>', 'Filter papers by tag')
    .option('-a, --all', 'Export all papers without filtering', false)
    .option('-o, --output <file>', 'Output to file instead of console')
    .action(async (searchTerms: string[], options: CommandOptions) => {
      try {
        let result: PaginatedResult<Paper>;
        
        if (options.all) {
          // Get all papers
          result = await paperDB.getAllPaginated(1, 1000); // Get a large number of papers
        } else if (options.tag) {
          // Get papers by tag
          result = await paperDB.getByTagPaginated(options.tag, 1, 1000);
        } else if (searchTerms.length > 0) {
          // Search papers by keywords
          result = await paperDB.searchPapers(searchTerms);
        } else {
          console.log(chalk.yellow('Please specify search terms, a tag with -t, or use --all for all papers.'));
          return;
        }
        
        if (result.papers.length === 0) {
          console.log(chalk.yellow('No papers found.'));
          return;
        }
        
        // Collect BibTeX entries
        const bibtexEntries: string[] = [];
        
        result.papers.forEach(paper => {
          if (paper.bibtex) {
            bibtexEntries.push(paper.bibtex);
          }
        });
        
        if (bibtexEntries.length === 0) {
          console.log(chalk.yellow('No BibTeX entries found for the selected papers.'));
          return;
        }
        
        const combinedBibtex = bibtexEntries.join('\n\n');
        
        // Output to file or console
        if (options.output) {
          fs.writeFileSync(options.output, combinedBibtex);
          console.log(chalk.green(`BibTeX exported to ${options.output}`));
        } else {
          console.log('\n' + combinedBibtex);
          console.log(chalk.gray(`\nExported ${bibtexEntries.length} BibTeX entries.`));
        }
      } catch (error) {
        console.error(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
};

export default bibtexCommand; 