import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { Command } from 'commander';
import { findPapers, findPapersByTag, deletePapers } from '../utils/database';
import { CommandFunction, CommandOptions, Paper } from '../types';

const deleteCommand: CommandFunction = (program: Command) => {
  program
    .command('delete [searchTerms...]')
    .description('Delete papers')
    .option('-t, --tag <tag>', 'Delete all papers with a specific tag')
    .option('-f, --force', 'Force delete without confirmation', false)
    .action(async (searchTerms: string[], options: CommandOptions) => {
      try {
        let papers: Paper[] = [];
        
        // Determine which papers to delete
        if (options.tag) {
          papers = findPapersByTag(options.tag);
          console.log(chalk.blue(`Finding papers with tag: ${options.tag}`));
        } else if (searchTerms.length > 0) {
          papers = findPapers(searchTerms);
          console.log(chalk.blue(`Finding papers matching: ${searchTerms.join(' ')}`));
        } else {
          console.log(chalk.yellow('Please specify search terms or a tag to delete papers.'));
          return;
        }
        
        if (papers.length === 0) {
          console.log(chalk.yellow('No papers found.'));
          return;
        }
        
        // Display papers to be deleted
        console.log(chalk.gray(`Found ${papers.length} papers to delete:`));
        console.log();
        
        papers.forEach((paper, index) => {
          console.log(chalk.red(`${index + 1}. ${paper.title || 'Untitled'}`));
          
          // Display authors
          if (paper.authors && paper.authors.length > 0) {
            const authorText = paper.authors.join(', ');
            console.log(chalk.gray(`   Authors: ${authorText}`));
          }
          
          // Display tag
          console.log(chalk.gray(`   Tag: ${paper.tag || 'default'}`));
          
          // Display ID
          console.log(chalk.gray(`   ID: ${paper.id}`));
          
          console.log(); // Add a blank line between papers
        });
        
        // Confirm deletion
        let shouldDelete = options.force;
        
        if (!shouldDelete) {
          const answers = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: chalk.red(`Are you sure you want to delete these ${papers.length} papers?`),
              default: false
            }
          ]);
          
          shouldDelete = answers.confirm;
        }
        
        if (!shouldDelete) {
          console.log(chalk.yellow('Operation cancelled.'));
          return;
        }
        
        // Delete papers
        const paperIds = papers.map(paper => paper.id);
        
        // Delete files
        papers.forEach(paper => {
          // Get the directory containing the paper files
          const paperDir = paper.pdfPath ? paper.pdfPath.replace('/paper.pdf', '') : null;
          
          if (paperDir && fs.existsSync(paperDir)) {
            fs.removeSync(paperDir);
            console.log(chalk.gray(`Removed directory: ${paperDir}`));
          }
        });
        
        // Delete from database
        deletePapers(paperIds);
        
        console.log(chalk.green(`Successfully deleted ${papers.length} papers.`));
      } catch (error) {
        console.error(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
};

export default deleteCommand; 