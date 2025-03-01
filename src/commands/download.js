const chalk = require('chalk');
const { 
  extractArxivId, 
  getPaperMetadata, 
  downloadPdf, 
  downloadSource, 
  createPaperDirectory 
} = require('../utils/arxiv');
const { addPaper } = require('../utils/database');

module.exports = function(program) {
  program
    .command('download <url>')
    .alias('d')
    .description('Download a paper from arXiv')
    .option('-t, --tag <tag>', 'Tag for organizing papers', 'default')
    .action(async (url, options) => {
      try {
        console.log(chalk.blue('Downloading paper...'));
        console.log(chalk.gray('Options received:'), options);
        
        // Extract arXiv ID from URL
        const arxivId = extractArxivId(url);
        console.log(chalk.gray(`ArXiv ID: ${arxivId}`));
        
        // Get paper metadata
        console.log(chalk.gray('Fetching paper metadata...'));
        const paper = await getPaperMetadata(arxivId);
        
        // Check if tag is provided in command line arguments
        let tag = 'default';
        const shortTagIndex = process.argv.indexOf('-t');
        const longTagIndex = process.argv.indexOf('--tag');
        const tagIndex = shortTagIndex !== -1 ? shortTagIndex : longTagIndex;

        if (tagIndex !== -1 && process.argv.length > tagIndex + 1) {
          tag = process.argv[tagIndex + 1];
        }
        
        console.log(chalk.gray(`Using tag: ${tag}`));
        
        const paperDir = createPaperDirectory(paper, tag);
        console.log(chalk.gray(`Created directory: ${paperDir}`));
        
        // Download PDF
        console.log(chalk.gray('Downloading PDF...'));
        const pdfPath = await downloadPdf(arxivId, paperDir);
        
        // Download source files
        console.log(chalk.gray('Downloading source files...'));
        const sourcePath = await downloadSource(arxivId, paperDir);
        
        // Add paper to database
        const paperWithTag = {
          ...paper,
          tag,
          pdfPath,
          sourcePath,
          downloadDate: new Date().toISOString()
        };
        addPaper(paperWithTag);
        
        console.log(chalk.green(`\nSuccessfully downloaded paper: ${paper.title || 'Untitled'}`));
        console.log(chalk.gray(`PDF: ${pdfPath}`));
        console.log(chalk.gray(`Source: ${sourcePath}`));
      } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
}; 