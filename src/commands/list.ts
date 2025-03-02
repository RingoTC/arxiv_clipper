import { paperDB } from '../models/Paper';
import chalk from 'chalk';
import { Command } from 'commander';
import { CommandFunction } from '../types';

interface ListOptions {
  tag?: string;
}

export async function listPapers(keywords: string[], options: ListOptions) {
  try {
    const papers = await paperDB.searchPapers(keywords, options.tag);
    
    if (papers.length === 0) {
      console.log(chalk.yellow('No papers found.'));
      return;
    }
    
    console.log(chalk.bold(`Found ${papers.length} papers:`));
    papers.forEach((paper, index) => {
      console.log(chalk.blue(`\n${index + 1}. ${paper.title}`));
      console.log(chalk.gray(`   Authors: ${paper.authors}`));
      console.log(chalk.gray(`   ArXiv ID: ${paper.arxivId || paper.id}`));
      console.log(chalk.gray(`   Tag: ${paper.tag || 'none'}`));
      
      if (paper.abstract) {
        console.log(chalk.gray(`   Abstract: ${paper.abstract.substring(0, 150)}...`));
      }
    });
  } catch (error) {
    console.error(chalk.red('Failed to list papers:'), error);
  }
}

const listCommand: CommandFunction = (program: Command) => {
  program
    .command('list [keywords...]')
    .description('List downloaded papers')
    .option('-t, --tag <tag>', 'Filter papers by tag')
    .action((keywords, options) => {
      listPapers(keywords, options);
    });
};

export default listCommand; 