import { Command } from 'commander';
import { CommandFunction } from '../types';
import { paperDB } from '../models/Paper';
import chalk from 'chalk';
import path from 'path';
import open from 'open';
import fs from 'fs-extra';

export async function openPaperDirectory(arxivId: string) {
  try {
    // Get paper from database
    const papers = await paperDB.searchPapers(arxivId);
    
    if (papers.length === 0) {
      console.error(chalk.red(`Paper with ID ${arxivId} not found.`));
      return;
    }
    
    const paper = papers[0];
    
    // Open the parent directory containing all files
    if (paper.localPdfPath) {
      const pathToOpen = path.dirname(paper.localPdfPath);
      console.log(chalk.green(`Opening directory for ${paper.title}...`));
      await open(pathToOpen, { wait: false });
    } else {
      console.error(chalk.red(`No local files found for paper ${paper.title}.`));
      return;
    }
  } catch (error) {
    console.error(chalk.red('Failed to open directory:'), error);
  }
}

// Open the entire knowledge base
export async function openKnowledgeBase() {
  try {
    const knowledgeBasePath = path.join(process.env.HOME || process.env.USERPROFILE || '', 'Development', 'arxiv');
    
    if (!fs.existsSync(knowledgeBasePath)) {
      console.error(chalk.red(`Knowledge base directory not found at ${knowledgeBasePath}.`));
      return;
    }
    
    console.log(chalk.green(`Opening arXiv knowledge base...`));
    await open(knowledgeBasePath, { wait: false });
  } catch (error) {
    console.error(chalk.red('Failed to open knowledge base:'), error);
  }
}

const openCommand: CommandFunction = (program: Command) => {
  program
    .command('open <arxivId>')
    .description('Open the directory containing paper files')
    .action((arxivId) => {
      openPaperDirectory(arxivId);
    });
    
  program
    .command('open-kb')
    .description('Open the entire arXiv knowledge base directory')
    .action(() => {
      openKnowledgeBase();
    });
};

export default openCommand; 