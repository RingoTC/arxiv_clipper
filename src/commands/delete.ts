import { paperDB } from '../models/Paper.js';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { unlink } from 'fs/promises';

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
      name: `${index + 1}. ${paper.title} (${paper.arxivId})`,
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
        await unlink(paper.pdfPath);
        await unlink(paper.sourcePath);
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