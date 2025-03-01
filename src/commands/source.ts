import chalk from 'chalk';
import { exec } from 'child_process';
import { Command } from 'commander';
import { findPapers } from '../utils/database';
import { CommandFunction, CommandOptions, Paper } from '../types';

const sourceCommand: CommandFunction = (program: Command) => {
  program
    .command('source [searchTerms...]')
    .description('Open source files of a paper')
    .action((searchTerms: string[], options: CommandOptions) => {
      try {
        if (searchTerms.length === 0) {
          console.log(chalk.yellow('Please specify search terms to find a paper.'));
          return;
        }
        
        // Find papers matching search terms
        const papers = findPapers(searchTerms);
        
        if (papers.length === 0) {
          console.log(chalk.yellow('No papers found.'));
          return;
        }
        
        if (papers.length > 1) {
          console.log(chalk.yellow('Multiple papers found. Please refine your search.'));
          console.log(chalk.gray('Matching papers:'));
          
          papers.forEach((paper, index) => {
            console.log(chalk.gray(`${index + 1}. ${paper.title || 'Untitled'}`));
          });
          
          return;
        }
        
        const paper = papers[0];
        
        if (!paper.sourcePath) {
          console.log(chalk.yellow('No source files found for this paper.'));
          return;
        }
        
        console.log(chalk.blue(`Opening source files for: ${paper.title || 'Untitled'}`));
        
        // Open source files
        const command = process.platform === 'darwin' 
          ? `open "${paper.sourcePath}"` 
          : process.platform === 'win32' 
            ? `start "" "${paper.sourcePath}"` 
            : `xdg-open "${paper.sourcePath}"`;
        
        exec(command, (error: Error | null) => {
          if (error) {
            console.error(chalk.red(`Error opening source files: ${error.message}`));
            return;
          }
          
          console.log(chalk.green('Source files opened successfully.'));
        });
      } catch (error) {
        console.error(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
};

export default sourceCommand; 