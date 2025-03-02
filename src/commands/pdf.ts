import { paperDB } from '../models/Paper';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { exec } from 'child_process';
import { Command } from 'commander';
import { CommandFunction } from '../types';

interface PdfOptions {
  tag?: string;
}

export async function openPdf(keywords: string[], options: PdfOptions) {
  try {
    console.log('Searching for papers with keywords:', keywords);
    const papers = await paperDB.searchPapers(keywords);
    console.log('Search results:', papers);
    
    if (papers.length === 0) {
      console.log(chalk.yellow('No papers found.'));
      return;
    }
    
    const choices = papers.map((paper, index) => ({
      name: `${index + 1}. ${paper.title} (${paper.arxivId || paper.id})`,
      value: paper.localPdfPath || paper.pdfPath
    }));
    
    const { selectedPdf } = await inquirer.prompt([{
      type: 'list',
      name: 'selectedPdf',
      message: 'Select a paper to open PDF:',
      choices,
      default: choices[0].value
    }]);
    
    if (!selectedPdf) {
      console.log(chalk.yellow('No PDF selected.'));
      return;
    }
    
    // Open PDF with default application
    exec(`open "${selectedPdf}"`, (error: Error | null) => {
      if (error) {
        console.error(chalk.red('Failed to open PDF:'), error);
      }
    });
  } catch (error) {
    console.error(chalk.red('Failed to open PDF:'), error);
  }
}

const pdfCommand: CommandFunction = (program: Command) => {
  program
    .command('pdf [keywords...]')
    .description('Open a paper PDF')
    .option('-t, --tag <tag>', 'Filter papers by tag')
    .action((keywords, options) => {
      openPdf(keywords, options);
    });
};

export default pdfCommand; 