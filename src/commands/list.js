const chalk = require('chalk');
const { findPapers, findPapersByTag } = require('../utils/database');

module.exports = function(program) {
  program
    .command('list [searchTerms...]')
    .alias('ls')
    .description('List downloaded papers')
    .option('-t, --tag <tag>', 'Filter papers by tag')
    .action((searchTerms, options) => {
      try {
        // Check if tag is provided in command line arguments
        let tag = null;
        const shortTagIndex = process.argv.indexOf('-t');
        const longTagIndex = process.argv.indexOf('--tag');
        const tagIndex = shortTagIndex !== -1 ? shortTagIndex : longTagIndex;

        if (tagIndex !== -1 && process.argv.length > tagIndex + 1) {
          tag = process.argv[tagIndex + 1];
          console.log(chalk.gray(`Filtering by tag: ${tag}`));
          
          // Get papers by tag
          const papers = findPapersByTag(tag);
          
          if (papers.length === 0) {
            console.log(chalk.yellow(`No papers found with tag: ${tag}`));
            return;
          }
          
          console.log(chalk.blue(`Found ${papers.length} papers with tag: ${tag}`));
          console.log('');
          
          // Display papers
          papers.forEach((paper, index) => {
            console.log(chalk.green(`${index + 1}. ${paper.title || 'Untitled'}`));
            // Ensure authors is always an array
            const authors = Array.isArray(paper.authors) ? paper.authors : [paper.authors].filter(Boolean);
            console.log(chalk.gray(`   Authors: ${authors.join(', ')}`));
            console.log(chalk.gray(`   ID: ${paper.id || 'N/A'}`));
            console.log(chalk.gray(`   URL: ${paper.url || 'N/A'}`));
            console.log(chalk.gray(`   Tag: ${paper.tag || 'default'}`));
            console.log(chalk.gray(`   Downloaded: ${paper.downloadDate ? new Date(paper.downloadDate).toLocaleString() : 'N/A'}`));
            console.log('');
          });
        } else {
          // Get papers by search terms
          const papers = findPapers(searchTerms);
          
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
            console.log(chalk.gray(`   URL: ${paper.url || 'N/A'}`));
            console.log(chalk.gray(`   Tag: ${paper.tag || 'default'}`));
            console.log(chalk.gray(`   Downloaded: ${paper.downloadDate ? new Date(paper.downloadDate).toLocaleString() : 'N/A'}`));
            console.log('');
          });
        }
      } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
}; 