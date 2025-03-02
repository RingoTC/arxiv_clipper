import { paperDB } from '../models/Paper';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { Command } from 'commander';
import { CommandFunction, Paper } from '../types';

interface DeleteOptions {
  tag?: string;
}

export async function deleteItems(keywords: string[], options: DeleteOptions) {
  try {
    if (options.tag) {
      await paperDB.deleteByTag(options.tag);
      console.log(chalk.green(`Successfully deleted all papers with tag: ${options.tag}`));
      return;
    }

    const result = await paperDB.searchPapers(keywords);
    
    if (result.papers.length === 0) {
      console.log(chalk.yellow('No papers found to delete.'));
      return;
    }

    const choices = result.papers.map((paper, index) => ({
      name: `${index + 1}. ${paper.title} (${paper.arxivId || paper.id})`,
      value: paper.id
    }));

    const { selectedPapers } = await inquirer.prompt([{
      type: 'checkbox',
      name: 'selectedPapers',
      message: 'Select papers to delete:',
      choices,
      default: [choices[0].value]
    }]);

    if (selectedPapers.length === 0) {
      console.log(chalk.yellow('No papers selected for deletion.'));
      return;
    }

    // Delete files
    for (const paperId of selectedPapers) {
      const paper = result.papers.find(p => p.id === paperId);
      if (paper) {
        try {
          if (paper.pdfPath && existsSync(paper.pdfPath)) {
            await unlink(paper.pdfPath);
          }
          if (paper.sourcePath && existsSync(paper.sourcePath)) {
            await unlink(paper.sourcePath);
          }
        } catch (error) {
          console.warn(chalk.yellow(`Warning: Could not delete some files for paper: ${paper.title}`));
        }
      }
    }

    // Delete from database
    await paperDB.deletePapers(selectedPapers);
    console.log(chalk.green('Successfully deleted selected papers.'));
  } catch (error) {
    console.error(chalk.red('Failed to delete papers:'), error);
  }
}

export async function deletePaper(id: string) {
  try {
    // Search for the paper
    const result = await paperDB.searchPapers(id);
    
    if (result.papers.length === 0) {
      console.log(chalk.yellow(`No paper found with ID: ${id}`));
      return;
    }
    
    // Delete the paper
    await paperDB.delete(id);
    console.log(chalk.green(`Paper deleted: ${id}`));
  } catch (error) {
    console.error(chalk.red('Failed to delete paper:'), error);
  }
}

export async function deleteInteractive() {
  try {
    // Get all papers
    const result = await paperDB.getAllPaginated(1, 1000); // Get a large number of papers
    
    if (result.papers.length === 0) {
      console.log(chalk.yellow('No papers found.'));
      return;
    }
    
    // Create choices for inquirer
    const choices = result.papers.map((paper, index) => ({
      name: `${index + 1}. ${paper.title} (${paper.id})`,
      value: paper.id
    }));
    
    // Add a "Cancel" option
    choices.push({
      name: 'Cancel',
      value: 'cancel'
    });
    
    // Prompt user to select papers to delete
    const { selectedPapers } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedPapers',
        message: 'Select papers to delete:',
        choices
      }
    ]);
    
    if (selectedPapers.includes('cancel') || selectedPapers.length === 0) {
      console.log(chalk.blue('No papers selected for deletion.'));
      return;
    }
    
    // Delete selected papers
    for (const paperId of selectedPapers) {
      if (paperId !== 'cancel') {
        await paperDB.delete(paperId);
        const paper = result.papers.find(p => p.id === paperId);
        if (paper) {
          console.log(chalk.green(`Paper deleted: ${paper.title} (${paper.id})`));
        }
      }
    }
  } catch (error) {
    console.error(chalk.red('Failed to delete papers:'), error);
  }
}

const deleteCommand: CommandFunction = (program: Command) => {
  program
    .command('delete [id]')
    .description('Delete a paper by ID or interactively')
    .action((id?: string) => {
      if (id) {
        deletePaper(id);
      } else {
        deleteInteractive();
      }
    });
};

export default deleteCommand; 