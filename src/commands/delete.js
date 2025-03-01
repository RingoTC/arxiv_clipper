const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const { findPapers, findPapersByTag, deletePapers } = require('../utils/database');

module.exports = function(program) {
  program
    .command('delete [searchTerms...]')
    .alias('rm')
    .description('Delete downloaded papers')
    .option('-t, --tag <tag>', 'Delete papers by tag')
    .option('-f, --force', 'Skip confirmation', false)
    .action(async (searchTerms, options) => {
      try {
        // Check if tag is provided in command line arguments
        let tag = null;
        const shortTagIndex = process.argv.indexOf('-t');
        const longTagIndex = process.argv.indexOf('--tag');
        const tagIndex = shortTagIndex !== -1 ? shortTagIndex : longTagIndex;

        if (tagIndex !== -1 && process.argv.length > tagIndex + 1) {
          tag = process.argv[tagIndex + 1];
          console.log(chalk.gray(`Filtering by tag: ${tag}`));
        }
        
        // Get papers based on search terms or tag
        const papers = tag 
          ? findPapersByTag(tag)
          : findPapers(searchTerms);
        
        if (papers.length === 0) {
          console.log(chalk.yellow('No papers found.'));
          return;
        }
        
        console.log(chalk.blue(`Found ${papers.length} papers:`));
        console.log('');
        
        // Display papers
        papers.forEach((paper, index) => {
          console.log(chalk.green(`${index + 1}. ${paper.title || 'Untitled'}`));
          // Ensure authors is always an array
          const authors = Array.isArray(paper.authors) ? paper.authors : [paper.authors].filter(Boolean);
          console.log(chalk.gray(`   Authors: ${authors.join(', ')}`));
          console.log(chalk.gray(`   ID: ${paper.id || 'N/A'}`));
          console.log(chalk.gray(`   Tag: ${paper.tag || 'default'}`));
          console.log('');
        });
        
        // Check if force option is provided
        let force = false;
        const forceIndex = process.argv.indexOf('-f');
        const longForceIndex = process.argv.indexOf('--force');
        if (forceIndex !== -1 || longForceIndex !== -1) {
          force = true;
        }
        
        // Confirm deletion
        let shouldDelete = force;
        
        if (!shouldDelete) {
          const answer = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Are you sure you want to delete ${papers.length} papers?`,
              default: false
            }
          ]);
          
          shouldDelete = answer.confirm;
        }
        
        if (shouldDelete) {
          // Delete papers from filesystem
          for (const paper of papers) {
            if (paper.pdfPath) {
              const paperDir = path.dirname(paper.pdfPath);
              fs.removeSync(paperDir);
            }
          }
          
          // Delete papers from database
          const paperIds = papers.map(paper => paper.id).filter(Boolean);
          deletePapers(paperIds);
          
          console.log(chalk.green(`\nSuccessfully deleted ${papers.length} papers.`));
        } else {
          console.log(chalk.yellow('\nDeletion cancelled.'));
        }
      } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
}; 