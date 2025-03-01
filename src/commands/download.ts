import chalk from 'chalk';
import { Command } from 'commander';
import { 
  extractArxivId, 
  getPaperMetadata, 
  downloadPdf, 
  downloadSource, 
  createPaperDirectory,
  getBibTeX,
  saveBibTeX
} from '../utils/arxiv';
import { addPaper } from '../utils/database';
import { CommandFunction, CommandOptions, Paper } from '../types';

const downloadCommand: CommandFunction = (program: Command) => {
  program
    .command('download <url>')
    .alias('d')
    .description('Download a paper from arXiv')
    .option('-t, --tag <tag>', 'Tag for organizing papers', 'default')
    .action(async (url: string, options: CommandOptions) => {
      try {
        console.log(chalk.blue('Downloading paper...'));
        
        // Extract arXiv ID from URL
        const arxivId = extractArxivId(url);
        console.log(chalk.gray(`ArXiv ID: ${arxivId}`));
        
        // Get paper metadata
        console.log(chalk.gray('Fetching paper metadata...'));
        const paper = await getPaperMetadata(arxivId);
        
        // Use the tag from options object
        const tag = options.tag || 'default';
        console.log(chalk.gray(`Using tag: ${tag}`));
        
        const paperDir = createPaperDirectory(paper, tag);
        console.log(chalk.gray(`Created directory: ${paperDir}`));
        
        // Download PDF
        console.log(chalk.gray('Downloading PDF...'));
        const pdfPath = await downloadPdf(arxivId, paperDir);
        
        // Download source files
        console.log(chalk.gray('Downloading source files...'));
        const sourcePath = await downloadSource(arxivId, paperDir);
        
        // Get and save BibTeX
        console.log(chalk.gray('Fetching BibTeX citation...'));
        const bibtex = await getBibTeX(arxivId);
        const bibtexPath = await saveBibTeX(bibtex, paperDir);
        
        // Add paper to database
        const paperWithTag: Paper = {
          ...paper,
          tag,
          pdfPath,
          sourcePath,
          bibtexPath,
          bibtex,
          downloadDate: new Date().toISOString()
        };
        addPaper(paperWithTag);
        
        console.log(chalk.green(`\nSuccessfully downloaded paper: ${paper.title || 'Untitled'}`));
        console.log(chalk.gray(`PDF: ${pdfPath}`));
        console.log(chalk.gray(`Source: ${sourcePath}`));
        console.log(chalk.gray(`BibTeX: ${bibtexPath}`));
      } catch (error) {
        console.error(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
};

export default downloadCommand; 