import chalk from 'chalk';
import { Command } from 'commander';
import { findPapers, findPapersByTag } from '../utils/database';
import { CommandFunction, CommandOptions, Paper } from '../types';

const listCommand: CommandFunction = (program: Command) => {
  program
    .command('list [searchTerms...]')
    .alias('ls')
    .description('List downloaded papers')
    .option('-t, --tag <tag>', 'Filter papers by tag')
    .action((searchTerms: string[], options: CommandOptions) => {
      try {
        let papers: Paper[] = [];
        
        // If tag is provided, filter by tag
        if (options.tag) {
          papers = findPapersByTag(options.tag);
          console.log(chalk.blue(`Listing papers with tag: ${options.tag}`));
        } else {
          // Otherwise, search by terms if provided
          papers = findPapers(searchTerms);
          if (searchTerms.length > 0) {
            console.log(chalk.blue(`Searching for papers matching: ${searchTerms.join(' ')}`));
          } else {
            console.log(chalk.blue('Listing all papers'));
          }
        }
        
        if (papers.length === 0) {
          console.log(chalk.yellow('No papers found.'));
          return;
        }
        
        // Display papers
        console.log(chalk.gray(`Found ${papers.length} papers:`));
        console.log();
        
        papers.forEach((paper, index) => {
          console.log(chalk.green(`${index + 1}. ${paper.title || 'Untitled'}`));
          
          // Display authors
          if (paper.authors && paper.authors.length > 0) {
            const authorText = paper.authors.join(', ');
            console.log(chalk.gray(`   Authors: ${authorText}`));
          }
          
          // Display tag
          console.log(chalk.gray(`   Tag: ${paper.tag || 'default'}`));
          
          // Display ID and URL
          console.log(chalk.gray(`   ID: ${paper.id}`));
          console.log(chalk.gray(`   URL: ${paper.url}`));
          
          // Display download date
          if (paper.downloadDate) {
            const date = new Date(paper.downloadDate);
            console.log(chalk.gray(`   Downloaded: ${date.toLocaleDateString()}`));
          }
          
          console.log(); // Add a blank line between papers
        });
      } catch (error) {
        console.error(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
};

export default listCommand; 