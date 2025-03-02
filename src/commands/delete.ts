import { paperDB } from '../models/Paper';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';

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

    const papers = await paperDB.searchPapers(keywords);
    
    if (papers.length === 0) {
      console.log(chalk.yellow('No papers found to delete.'));
      return;
    }

    const choices = papers.map((paper, index) => ({
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
    for (const paper of papers.filter(p => selectedPapers.includes(p.id))) {
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

    // Delete from database
    await paperDB.deletePapers(selectedPapers);
    console.log(chalk.green('Successfully deleted selected papers.'));
  } catch (error) {
    console.error(chalk.red('Failed to delete papers:'), error);
  }
}

// Add default export for the command
import { Command } from 'commander';
import { CommandFunction } from '../types';

const deleteCommand: CommandFunction = (program: Command) => {
  program
    .command('delete [keywords...]')
    .description('Delete papers from the database')
    .option('-t, --tag <tag>', 'Delete all papers with a specific tag')
    .action((keywords, options) => {
      deleteItems(keywords, options);
    });
};

export default deleteCommand; 