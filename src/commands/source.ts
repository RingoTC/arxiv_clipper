import { paperDB } from '../models/Paper';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { exec } from 'child_process';
import { Command } from 'commander';
import { CommandFunction, Paper, PaginatedResult } from '../types';
import fs from 'fs-extra';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface SourceOptions {
  tag?: string;
}

export async function openSource(keywords: string[], options: SourceOptions) {
  try {
    const result = await paperDB.searchPapers(keywords);
    
    if (result.papers.length === 0) {
      console.log(chalk.yellow('No papers found.'));
      return;
    }
    
    const choices = result.papers.map((paper: Paper, index: number) => ({
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

export async function extractSource(id: string) {
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
    
    // Create source directory
    const pdfDir = path.dirname(paper.localPdfPath);
    const sourceDir = path.join(pdfDir, 'source');
    await fs.ensureDir(sourceDir);
    
    // Extract source
    console.log(chalk.green(`Extracting LaTeX source for paper: ${paper.title}`));
    
    // Check if source URL exists
    if (paper.sourceUrl) {
      // Download source from arXiv
      console.log(chalk.blue(`Downloading source from: ${paper.sourceUrl}`));
      await execAsync(`curl -L "${paper.sourceUrl}" -o "${path.join(sourceDir, 'source.tar.gz')}"`);
      
      // Extract the tar.gz file
      console.log(chalk.blue('Extracting source files...'));
      await execAsync(`tar -xzf "${path.join(sourceDir, 'source.tar.gz')}" -C "${sourceDir}"`);
      
      // Update paper with source path
      paper.localSourcePath = sourceDir;
      await paperDB.add(paper);
      
      console.log(chalk.green('Source extraction complete!'));
      console.log(chalk.blue(`Source files are available at: ${sourceDir}`));
    } else {
      console.log(chalk.yellow('No source URL available for this paper.'));
    }
  } catch (error) {
    console.error(chalk.red('Failed to extract source:'), error);
  }
}

export async function extractSourceInteractive() {
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
        message: 'Select a paper to extract source:',
        choices
      }
    ]);
    
    if (selectedPaper === 'cancel') {
      console.log(chalk.blue('Operation cancelled.'));
      return;
    }
    
    // Extract source for the selected paper
    await extractSource(selectedPaper);
  } catch (error) {
    console.error(chalk.red('Failed to extract source:'), error);
  }
}

const sourceCommand: CommandFunction = (program: Command) => {
  program
    .command('source [id]')
    .description('Extract LaTeX source for a paper')
    .action((id?: string) => {
      if (id) {
        extractSource(id);
      } else {
        extractSourceInteractive();
      }
    });
};

export default sourceCommand; 