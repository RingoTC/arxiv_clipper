import chalk from 'chalk';
import fs from 'fs-extra';
import { Command } from 'commander';
import { paperDB } from '../models/Paper';
import { CommandFunction, CommandOptions, Paper } from '../types';

const bibtexCommand: CommandFunction = (program: Command) => {
  program
    .command('bibtex [searchTerms...]')
    .description('Export BibTeX citations for papers')
    .option('-t, --tag <tag>', 'Filter papers by tag')
    .option('-a, --all', 'Export all papers without filtering', false)
    .option('-o, --output <file>', 'Output to file instead of console')
    .action(async (searchTerms: string[], options: CommandOptions) => {
      try {
        let papers: Paper[] = [];
        
        // Determine which papers to include
        if (options.all) {
          papers = await paperDB.getAll();
          console.log(chalk.blue('Exporting BibTeX for all papers'));
        } else if (options.tag) {
          papers = await paperDB.getByTag(options.tag);
          console.log(chalk.blue(`Exporting BibTeX for papers with tag: ${options.tag}`));
        } else if (searchTerms.length > 0) {
          papers = await paperDB.searchPapers(searchTerms);
          console.log(chalk.blue(`Exporting BibTeX for papers matching: ${searchTerms.join(' ')}`));
        } else {
          console.log(chalk.yellow('Please specify search terms, a tag, or use --all to export all papers.'));
          return;
        }
        
        if (papers.length === 0) {
          console.log(chalk.yellow('No papers found.'));
          return;
        }
        
        // Collect BibTeX entries
        const bibtexEntries: string[] = [];
        
        papers.forEach(paper => {
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