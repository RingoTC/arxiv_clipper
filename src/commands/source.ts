import { paperDB } from '../models/Paper.js';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function openSource(keywords: string[]) {
  try {
    const papers = await paperDB.searchPapers(keywords);
    
    if (papers.length === 0) {
      console.log(chalk.yellow('No papers found.'));
      return;
    }

    const choices = papers.map((paper, index) => ({
      name: `${index + 1}. ${paper.title} (${paper.arxivId})`,
      value: paper
    }));

    const { selectedPaper } = await inquirer.prompt([{
      type: 'list',
      name: 'selectedPaper',
      message: 'Select a paper to open source:',
      choices
    }]);

    // Open source in Cursor
    await execAsync(`cursor ${selectedPaper.sourcePath}`);
    console.log(chalk.green(`Opening source for: ${selectedPaper.title}`));
  } catch (error) {
    console.error(chalk.red('Failed to open source:'), error);
  }
} 