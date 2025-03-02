import { paperDB } from '../models/Paper';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { exec } from 'child_process';
import { Command } from 'commander';
import { CommandFunction } from '../types';

interface SourceOptions {
  tag?: string;
}

export async function openSource(keywords: string[], options: SourceOptions) {
  try {
    const papers = await paperDB.searchPapers(keywords);
    
    if (papers.length === 0) {
      console.log(chalk.yellow('No papers found.'));
      return;
    }
    
    const choices = papers.map((paper, index) => ({
      name: `${index + 1}. ${paper.title} (${paper.arxivId || paper.id})`,
      value: paper.sourcePath
    }));
    
    const { selectedSource } = await inquirer.prompt([{
      type: 'list',
      name: 'selectedSource',
      message: 'Select a paper to open source:',
      choices,
      default: choices[0].value
    }]);
    
    if (!selectedSource) {
      console.log(chalk.yellow('No source selected.'));
      return;
    }
    
    // Open source with default application
    exec(`open "${selectedSource}"`, (error: Error | null) => {
      if (error) {
        console.error(chalk.red('Failed to open source:'), error);
      }
    });
  } catch (error) {
    console.error(chalk.red('Failed to open source:'), error);
  }
}

const sourceCommand: CommandFunction = (program: Command) => {
  program
    .command('source [keywords...]')
    .description('Open a paper source')
    .option('-t, --tag <tag>', 'Filter papers by tag')
    .action((keywords, options) => {
      openSource(keywords, options);
    });
};

export default sourceCommand; 