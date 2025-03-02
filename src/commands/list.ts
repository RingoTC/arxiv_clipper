import { paperDB } from '../models/Paper';
import chalk from 'chalk';
import { Command } from 'commander';
import { CommandFunction } from '../types';

interface ListOptions {
  tag?: string;
  page?: number;
  pageSize?: number;
}

export async function listPapers(keywords: string[], options: ListOptions) {
  try {
    // Set default values for pagination
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    
    console.log(`Filtering by tag: ${options.tag || 'none'}`);
    
    let result;
    if (keywords && keywords.length > 0) {
      // If keywords are provided, use searchPapers
      result = await paperDB.searchPapers(keywords, options.tag, page, pageSize);
    } else if (options.tag) {
      // If only tag is provided, use getByTagPaginated
      console.log(`Using getByTagPaginated with tag: ${options.tag}`);
      result = await paperDB.getByTagPaginated(options.tag, page, pageSize);
    } else {
      // If no filters, get all papers
      result = await paperDB.getAllPaginated(page, pageSize);
    }
    
    const { papers, total } = result;
    
    if (papers.length === 0) {
      console.log(chalk.yellow('No papers found.'));
      return;
    }
    
    const totalPages = Math.ceil(total / pageSize);
    
    console.log(chalk.bold(`Found ${total} papers (showing page ${page} of ${totalPages}):`));
    papers.forEach((paper, index) => {
      console.log(chalk.blue(`\n${(page - 1) * pageSize + index + 1}. ${paper.title}`));
      console.log(chalk.gray(`   Authors: ${paper.authors}`));
      console.log(chalk.gray(`   ArXiv ID: ${paper.arxivId || paper.id}`));
      console.log(chalk.gray(`   Tag: ${paper.tag || 'none'}`));
      
      if (paper.abstract) {
        console.log(chalk.gray(`   Abstract: ${paper.abstract.substring(0, 150)}...`));
      }
    });
    
    // Show pagination info
    if (totalPages > 1) {
      console.log(chalk.cyan(`\nPage ${page} of ${totalPages} (${pageSize} items per page)`));
      
      if (page > 1) {
        console.log(chalk.gray(`Use --page ${page - 1} to view the previous page`));
      }
      
      if (page < totalPages) {
        console.log(chalk.gray(`Use --page ${page + 1} to view the next page`));
      }
    }
  } catch (error) {
    console.error(chalk.red('Failed to list papers:'), error);
  }
}

const listCommand: CommandFunction = (program: Command) => {
  program
    .command('list [keywords...]')
    .description('List downloaded papers')
    .option('-t, --tag <tag>', 'Filter papers by tag')
    .option('-p, --page <number>', 'Page number', (val) => parseInt(val, 10))
    .option('-s, --page-size <number>', 'Number of papers per page', (val) => parseInt(val, 10))
    .action((keywords, options) => {
      listPapers(keywords, options);
    });
};

export default listCommand; 