import { Command } from 'commander';
import { CommandFunction, Paper, PaginatedResult } from '../types';
import { paperDB } from '../models/Paper';
import chalk from 'chalk';
import path from 'path';
import open from 'open';
import fs from 'fs-extra';
import { homedir } from 'os';

export async function openPaperDirectory(id: string, options: { source?: boolean; github?: boolean } = {}) {
  try {
    // Search for the paper
    const result = await paperDB.searchPapers(id);
    
    if (result.papers.length === 0) {
      console.log(chalk.yellow(`No paper found with ID: ${id}`));
      return;
    }
    
    const paper = result.papers[0];
    
    let dirToOpen;
    
    if (options.source && paper.localSourcePath) {
      // Open source directory
      dirToOpen = paper.localSourcePath;
      console.log(chalk.green(`Opening source directory for paper: ${paper.title}`));
    } else if (options.github && paper.localGithubPath) {
      // Open GitHub repository directory
      dirToOpen = paper.localGithubPath;
      console.log(chalk.green(`Opening GitHub repository for paper: ${paper.title}`));
    } else if (paper.localPdfPath) {
      // Open parent directory
      dirToOpen = path.dirname(paper.localPdfPath);
      console.log(chalk.green(`Opening directory for paper: ${paper.title}`));
    } else {
      console.log(chalk.yellow(`No local files found for paper: ${paper.title}`));
      return;
    }
    
    // Open the directory
    await open(dirToOpen);
  } catch (error) {
    console.error(chalk.red('Failed to open paper directory:'), error);
  }
}

// Open the entire knowledge base
export async function openKnowledgeBase() {
  try {
    const kbPath = path.join(homedir(), 'Development', 'arxiv');
    console.log(chalk.green(`Opening knowledge base at: ${kbPath}`));
    await open(kbPath);
  } catch (error) {
    console.error(chalk.red('Failed to open knowledge base:'), error);
  }
}

const openCommand: CommandFunction = (program: Command) => {
  program
    .command('open [id]')
    .description('Open the directory containing a paper')
    .option('-s, --source', 'Open the LaTeX source directory')
    .option('-g, --github', 'Open the GitHub repository directory')
    .action((id, options) => {
      if (id) {
        openPaperDirectory(id, options);
      } else {
        console.log(chalk.yellow('Please provide a paper ID.'));
      }
    });
    
  program
    .command('open-kb')
    .description('Open the knowledge base directory')
    .action(() => {
      openKnowledgeBase();
    });
};

export default openCommand; 