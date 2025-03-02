import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { Command } from 'commander';
import { PAPERS_DIR } from '../utils/config';
import { CommandFunction, CommandOptions } from '../types';
import { paperDB } from '../models/Paper';

const cleanCommand: CommandFunction = (program: Command) => {
  program
    .command('clean')
    .description('Clean the entire database and remove all stored papers')
    .option('-f, --force', 'Force clean without confirmation', false)
    .action(async (options: CommandOptions) => {
      try {
        // Skip confirmation if force option is provided
        if (!options.force) {
          const answers = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: chalk.red('WARNING: This will delete all papers and reset the database. Continue?'),
              default: false
            }
          ]);
          
          if (!answers.confirm) {
            console.log(chalk.yellow('Operation cancelled.'));
            return;
          }
        }
        
        // Remove all papers
        console.log(chalk.gray('Removing all papers...'));
        
        // Check if papers directory exists
        if (fs.existsSync(PAPERS_DIR)) {
          // Remove all subdirectories in the papers directory
          const tagDirs = fs.readdirSync(PAPERS_DIR);
          
          for (const tagDir of tagDirs) {
            const tagPath = `${PAPERS_DIR}/${tagDir}`;
            
            // Skip if not a directory
            if (!fs.statSync(tagPath).isDirectory()) {
              continue;
            }
            
            // Remove the tag directory and all its contents
            fs.removeSync(tagPath);
            console.log(chalk.gray(`Removed tag directory: ${tagDir}`));
          }
        }
        
        // Reset SQLite database
        console.log(chalk.gray('Resetting SQLite database...'));
        try {
          // Get all papers from the database
          const papers = await paperDB.getAll();
          if (papers.length > 0) {
            // Delete all papers from the database
            const paperIds = papers.map(paper => paper.id);
            await paperDB.deletePapers(paperIds);
            console.log(chalk.gray(`Removed ${papers.length} papers from SQLite database.`));
          } else {
            console.log(chalk.gray('SQLite database is already empty.'));
          }
        } catch (dbError) {
          console.error(chalk.yellow(`Warning: Failed to clean SQLite database: ${(dbError as Error).message}`));
        }
        
        console.log(chalk.green('Successfully cleaned all papers and reset the database.'));
      } catch (error) {
        console.error(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
};

export default cleanCommand; 