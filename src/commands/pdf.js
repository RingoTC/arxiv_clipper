const chalk = require('chalk');
const { exec } = require('child_process');
const { findPapers } = require('../utils/database');

module.exports = function(program) {
  program
    .command('pdf [searchTerms...]')
    .description('Open PDF of a paper')
    .action((searchTerms, options) => {
      try {
        // Get search terms from command line arguments
        let terms = searchTerms;
        if (!terms || terms.length === 0) {
          // Extract search terms from command line arguments
          const args = process.argv.slice(2);
          const pdfIndex = args.indexOf('pdf');
          if (pdfIndex !== -1 && args.length > pdfIndex + 1) {
            terms = args.slice(pdfIndex + 1);
          }
        }
        
        if (!terms || terms.length === 0) {
          console.log(chalk.yellow('Please provide search terms to find a paper.'));
          return;
        }
        
        // Find papers matching search terms
        const papers = findPapers(terms);
        
        if (papers.length === 0) {
          console.log(chalk.yellow('No papers found.'));
          return;
        }
        
        if (papers.length > 1) {
          console.log(chalk.yellow('Multiple papers found. Please refine your search.'));
          console.log('');
          
          // Display papers
          papers.forEach((paper, index) => {
            console.log(chalk.green(`${index + 1}. ${paper.title || 'Untitled'}`));
            // Ensure authors is always an array
            const authors = Array.isArray(paper.authors) ? paper.authors : [paper.authors].filter(Boolean);
            console.log(chalk.gray(`   Authors: ${authors.join(', ')}`));
            console.log(chalk.gray(`   ID: ${paper.id || 'N/A'}`));
            console.log('');
          });
          
          return;
        }
        
        const paper = papers[0];
        
        if (!paper.pdfPath) {
          console.log(chalk.yellow('PDF not found for this paper.'));
          return;
        }
        
        // Open PDF
        console.log(chalk.blue(`Opening PDF for: ${paper.title || 'Untitled'}`));
        
        // Use appropriate command based on OS
        const command = process.platform === 'darwin' 
          ? `open "${paper.pdfPath}"`
          : process.platform === 'win32'
            ? `start "" "${paper.pdfPath}"`
            : `xdg-open "${paper.pdfPath}"`;
        
        exec(command, (error) => {
          if (error) {
            console.error(chalk.red(`Error opening PDF: ${error.message}`));
            process.exit(1);
          }
        });
      } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
}; 