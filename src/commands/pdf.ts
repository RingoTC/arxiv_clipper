import { paperDB } from '../models/Paper';
import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import { CommandFunction, Paper, PaginatedResult } from '../types';
import open from 'open';

export async function openPdf(id: string) {
  try {
    // Search for the paper
    const result = await paperDB.searchPapers(id);
    
    if (result.papers.length === 0) {
      console.log(chalk.yellow(`No paper found with ID: ${id}`));
      return;
    }
    
    const paper = result.papers[0];
    
    if (!paper.localPdfPath) {
      console.log(chalk.yellow(`No PDF found for paper: ${paper.title}`));
      return;
    }
    
    // Open the PDF
    console.log(chalk.green(`Opening PDF for paper: ${paper.title}`));
    await open(paper.localPdfPath);
  } catch (error) {
    console.error(chalk.red('Failed to open PDF:'), error);
  }
}

export async function openPdfInteractive() {
  try {
    // Get all papers
    const result = await paperDB.getAllPaginated(1, 1000); // Get a large number of papers
    
    if (result.papers.length === 0) {
      console.log(chalk.yellow('No papers found.'));
      return;
    }
    
    // Create choices for inquirer
    const choices = result.papers.map((paper: Paper, index: number) => ({
      name: `${index + 1}. ${paper.title} (${paper.id})`,
      value: paper.id
    }));
    
    // Add a "Cancel" option
    choices.push({
      name: 'Cancel',
      value: 'cancel'
    });
    
    // Prompt user to select a paper
    const { selectedPaper } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedPaper',
        message: 'Select a paper to open:',
        choices
      }
    ]);
    
    if (selectedPaper === 'cancel') {
      console.log(chalk.blue('Operation cancelled.'));
      return;
    }
    
    // Open the selected paper
    await openPdf(selectedPaper);
  } catch (error) {
    console.error(chalk.red('Failed to open PDF:'), error);
  }
}

const pdfCommand: CommandFunction = (program: Command) => {
  program
    .command('pdf [id]')
    .description('Open a paper PDF')
    .action((id?: string) => {
      if (id) {
        openPdf(id);
      } else {
        openPdfInteractive();
      }
    });
};

export default pdfCommand; 