import { paperDB } from '../models/Paper.js';
import chalk from 'chalk';

interface ListOptions {
  tag?: string;
}

export async function list(keywords: string[], options: ListOptions) {
  try {
    const papers = await paperDB.searchPapers(keywords, options.tag);
    
    if (papers.length === 0) {
      console.log(chalk.yellow('No papers found.'));
      return;
    }

    console.log(chalk.blue('\nFound papers:'));
    papers.forEach((paper, index) => {
      console.log(chalk.green(`\n${index + 1}. ${paper.title}`));
      console.log(chalk.gray(`   ArXiv ID: ${paper.arxivId}`));
      console.log(chalk.gray(`   Tag: ${paper.tag}`));
      console.log(chalk.gray(`   PDF: ${paper.pdfPath}`));
      console.log(chalk.gray(`   Source: ${paper.sourcePath}`));
    });
  } catch (error) {
    console.error(chalk.red('Failed to list papers:'), error);
  }
} 