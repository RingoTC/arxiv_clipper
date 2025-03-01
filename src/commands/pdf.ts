import chalk from 'chalk';
import { exec } from 'child_process';
import { Command } from 'commander';
import { findPapers } from '../utils/database';
import { CommandFunction, CommandOptions, Paper } from '../types';

const pdfCommand: CommandFunction = (program: Command) => {
  program
    .command('pdf [searchTerms...]')
    .description('Open PDF of a paper')
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
        
        if (!paper.pdfPath) {
          console.log(chalk.yellow('No PDF found for this paper.'));
          return;
        }
        
        console.log(chalk.blue(`Opening PDF for: ${paper.title || 'Untitled'}`));
        
        // Open PDF
        const command = process.platform === 'darwin' 
          ? `open "${paper.pdfPath}"` 
          : process.platform === 'win32' 
            ? `start "" "${paper.pdfPath}"` 
            : `xdg-open "${paper.pdfPath}"`;
        
        exec(command, (error: Error | null) => {
          if (error) {
            console.error(chalk.red(`Error opening PDF: ${error.message}`));
            return;
          }
          
          console.log(chalk.green('PDF opened successfully.'));
        });
      } catch (error) {
        console.error(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
};

export default pdfCommand; 