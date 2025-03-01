import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { Command } from 'commander';
import http from 'http';
import { findPapers } from '../utils/database';
import { CommandFunction, Paper } from '../types';
import open from 'open';

const bibtexWebCommand: CommandFunction = (program: Command) => {
  program
    .command('bibtex-web')
    .description('Start a web server for BibTeX export with search and selection')
    .option('-p, --port <port>', 'Port to run the server on', '3000')
    .action(async (options: { port: string }) => {
      try {
        const port = parseInt(options.port, 10);
        
        console.log(chalk.blue('Starting BibTeX web export server...'));
        
        // Create HTTP server
        const server = http.createServer((req, res) => {
          // Handle API requests
          if (req.url === '/api/papers') {
            const papers = findPapers([]);
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(papers));
            return;
          }
          
          // Serve HTML page
          if (req.url === '/' || req.url === '/index.html') {
            const templatePath = path.join(__dirname, '../templates/bibtex-export.html');
            
            try {
              const html = fs.readFileSync(templatePath, 'utf8');
              res.setHeader('Content-Type', 'text/html');
              res.end(html);
            } catch (error) {
              console.error(`Error reading template: ${(error as Error).message}`);
              res.statusCode = 500;
              res.end('Error loading template');
            }
            return;
          }
          
          // Handle 404
          res.statusCode = 404;
          res.end('Not found');
        });
        
        // Start server
        server.listen(port, () => {
          const url = `http://localhost:${port}`;
          console.log(chalk.green(`BibTeX web export server running at ${url}`));
          console.log(chalk.blue('Opening browser...'));
          
          // Open browser
          open(url).catch(() => {
            console.log(chalk.yellow(`Could not open browser automatically. Please navigate to ${url}`));
          });
          
          console.log(chalk.gray('Press Ctrl+C to stop the server'));
        });
        
        // Handle server errors
        server.on('error', (error: NodeJS.ErrnoException) => {
          if (error.code === 'EADDRINUSE') {
            console.error(chalk.red(`Port ${port} is already in use. Try a different port with --port option.`));
          } else {
            console.error(chalk.red(`Server error: ${error.message}`));
          }
          process.exit(1);
        });
        
      } catch (error) {
        console.error(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
};

export default bibtexWebCommand; 