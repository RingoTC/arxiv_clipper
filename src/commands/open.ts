import { Command } from 'commander';
import { CommandFunction } from '../types';
import { paperDB } from '../models/Paper';
import chalk from 'chalk';
import path from 'path';
import open from 'open';
import fs from 'fs-extra';

interface OpenOptions {
  type?: 'github' | 'source' | 'parent';
}

export async function openPaperDirectory(arxivId: string, options: OpenOptions = {}) {
  try {
    // Get paper from database
    const papers = await paperDB.searchPapers(arxivId);
    
    if (papers.length === 0) {
      console.error(chalk.red(`Paper with ID ${arxivId} not found.`));
      return;
    }
    
    const paper = papers[0];
    
    // Determine which path to open
    let pathToOpen: string | undefined;
    
    if (options.type === 'github') {
      if (!paper.localGithubPath) {
        console.error(chalk.red(`No GitHub repository found for paper ${paper.title}.`));
        return;
      }
      pathToOpen = paper.localGithubPath;
    } else if (options.type === 'source') {
      if (!paper.localSourcePath) {
        console.error(chalk.red(`No source files found for paper ${paper.title}.`));
        return;
      }
      
      // Extract source files if they haven't been extracted yet
      const sourceDir = path.join(path.dirname(paper.localSourcePath), 'source');
      if (!fs.existsSync(sourceDir)) {
        console.log(chalk.blue(`Extracting source files for ${paper.title}...`));
        await fs.ensureDir(sourceDir);
        await fs.exec(`tar -xzf "${paper.localSourcePath}" -C "${sourceDir}"`);
      }
      
      pathToOpen = sourceDir;
    } else if (options.type === 'parent') {
      // Open the parent directory containing both source and GitHub
      if (paper.localPdfPath) {
        pathToOpen = path.dirname(paper.localPdfPath);
      } else {
        console.error(chalk.red(`No local files found for paper ${paper.title}.`));
        return;
      }
    } else {
      // Default to parent directory
      if (paper.localPdfPath) {
        pathToOpen = path.dirname(paper.localPdfPath);
      } else {
        console.error(chalk.red(`No local files found for paper ${paper.title}.`));
        return;
      }
    }
    
    if (pathToOpen) {
      console.log(chalk.green(`Opening ${options.type || 'parent'} directory for ${paper.title}...`));
      await open(pathToOpen, { wait: false });
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
    .option('--github', 'Open the GitHub repository directory')
    .option('--source', 'Open the LaTeX source directory')
    .option('--parent', 'Open the parent directory (default)')
    .action((arxivId, options) => {
      let type: 'github' | 'source' | 'parent' | undefined;
      
      if (options.github) {
        type = 'github';
      } else if (options.source) {
        type = 'source';
      } else if (options.parent) {
        type = 'parent';
      }
      
      openPaperDirectory(arxivId, { type });
    });
    
  program
    .command('open-kb')
    .description('Open the entire arXiv knowledge base directory')
    .action(() => {
      openKnowledgeBase();
    });
};

export default openCommand; 