import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { Command } from 'commander';
import http from 'http';
import { findPapers, deletePapers } from '../utils/database';
import { CommandFunction, Paper } from '../types';
import open from 'open';
import { download } from './download';
import { homedir } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { paperDB } from '../models/Paper';
import { openPaperDirectory, openKnowledgeBase } from './open';

const execAsync = promisify(exec);

const webCommand: CommandFunction = (program: Command) => {
  program
    .command('web')
    .description('Start a web server for managing arXiv papers with all adown operations')
    .option('-p, --port <port>', 'Port to run the server on', '3000')
    .action(async (options: { port: string }) => {
      try {
        const port = parseInt(options.port, 10);
        
        console.log(chalk.blue('Starting arXiv papers management web server...'));
        
        // Create HTTP server
        const server = http.createServer(async (req, res) => {
          // Set CORS headers for all responses
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE, PATCH');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          
          // Handle OPTIONS requests (for CORS preflight)
          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }
          
          // API endpoints
          if (req.url?.startsWith('/api/')) {
            // Get papers list
            if (req.url === '/api/papers' && req.method === 'GET') {
              try {
                const papers = await paperDB.getAll();
                
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(papers));
              } catch (error) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: (error as Error).message }));
              }
              return;
            }
            
            // Download paper
            if (req.url === '/api/papers' && req.method === 'POST') {
              let body = '';
              
              req.on('data', chunk => {
                body += chunk.toString();
              });
              
              req.on('end', async () => {
                try {
                  const { url, tag, githubUrl } = JSON.parse(body);
                  
                  if (!url) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ error: 'URL is required' }));
                    return;
                  }
                  
                  // Download paper
                  await download(url, { tag: tag || 'default', github: githubUrl });
                  
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true }));
                } catch (error) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: (error as Error).message }));
                }
              });
              
              return;
            }
            
            // Update paper
            if (req.url?.startsWith('/api/papers/') && req.method === 'PATCH') {
              const paperId = req.url.replace('/api/papers/', '');
              let body = '';
              
              req.on('data', chunk => {
                body += chunk.toString();
              });
              
              req.on('end', async () => {
                try {
                  const { githubUrl } = JSON.parse(body);
                  
                  // Get paper
                  const papers = await paperDB.searchPapers(paperId);
                  if (papers.length === 0) {
                    res.statusCode = 404;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Paper not found' }));
                    return;
                  }
                  
                  const paper = papers[0];
                  
                  // Update paper
                  paper.githubUrl = githubUrl;
                  
                  // Save to database
                  await paperDB.add(paper);
                  
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true }));
                } catch (error) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: (error as Error).message }));
                }
              });
              
              return;
            }
            
            // Clone GitHub repository
            if (req.url?.startsWith('/api/github/clone/') && req.method === 'POST') {
              const paperId = req.url.replace('/api/github/clone/', '');
              
              try {
                // Get paper
                const papers = await paperDB.searchPapers(paperId);
                if (papers.length === 0) {
                  res.statusCode = 404;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Paper not found' }));
                  return;
                }
                
                const paper = papers[0];
                
                if (!paper.githubUrl) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Paper does not have a GitHub URL' }));
                  return;
                }
                
                // Create GitHub directory
                const paperDir = path.dirname(paper.localPdfPath || '');
                const githubDir = path.join(paperDir, 'github');
                await fs.ensureDir(githubDir);
                
                // Clone repository
                await execAsync(`git clone ${paper.githubUrl} ${githubDir}`);
                
                // Update paper
                paper.localGithubPath = githubDir;
                
                // Save to database
                await paperDB.add(paper);
                
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, localGithubPath: githubDir }));
              } catch (error) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: (error as Error).message }));
              }
              
              return;
            }
            
            // Delete papers
            if (req.url === '/api/papers/delete' && req.method === 'POST') {
              let body = '';
              
              req.on('data', chunk => {
                body += chunk.toString();
              });
              
              req.on('end', async () => {
                try {
                  const { ids } = JSON.parse(body);
                  
                  if (!ids || !Array.isArray(ids)) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ error: 'Paper IDs are required' }));
                    return;
                  }
                  
                  await paperDB.deletePapers(ids);
                  
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true }));
                } catch (error) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: (error as Error).message }));
                }
              });
              
              return;
            }
            
            // Open PDF
            if (req.url?.startsWith('/api/pdf/') && req.method === 'GET') {
              const paperId = req.url.replace('/api/pdf/', '');
              
              try {
                const papers = await paperDB.getAll();
                const paper = papers.find(p => p.id === paperId);
                
                if (!paper || !paper.localPdfPath) {
                  res.statusCode = 404;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'PDF not found' }));
                  return;
                }
                
                // Open PDF with default application
                open(paper.localPdfPath).catch(console.error);
                
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              } catch (error) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: (error as Error).message }));
              }
              return;
            }
            
            // Extract source
            if (req.url?.startsWith('/api/source/') && req.method === 'GET') {
              const paperId = req.url.replace('/api/source/', '');
              
              try {
                const papers = await paperDB.getAll();
                const paper = papers.find(p => p.id === paperId);
                
                if (!paper || !paper.localSourcePath) {
                  res.statusCode = 404;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Source not found' }));
                  return;
                }
                
                // Extract source to a directory
                const extractDir = path.join(path.dirname(paper.localSourcePath), 'source');
                await fs.ensureDir(extractDir);
                
                try {
                  await execAsync(`tar -xzf "${paper.localSourcePath}" -C "${extractDir}"`);
                  
                  // Open the directory
                  open(extractDir).catch(console.error);
                  
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true }));
                } catch (error) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: (error as Error).message }));
                }
              } catch (error) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: (error as Error).message }));
              }
              
              return;
            }
            
            // Open directory
            if (req.url?.startsWith('/api/open/') && req.method === 'GET') {
              const paperId = req.url.replace('/api/open/', '');
              const type = new URL(`http://localhost${req.url}`).searchParams.get('type') || 'parent';
              
              try {
                await openPaperDirectory(paperId, { type: type as any });
                
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              } catch (error) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: (error as Error).message }));
              }
              
              return;
            }
            
            // Open knowledge base
            if (req.url === '/api/open-kb' && req.method === 'GET') {
              try {
                await openKnowledgeBase();
                
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              } catch (error) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: (error as Error).message }));
              }
              
              return;
            }
            
            // 404 for unknown API endpoints
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'API endpoint not found' }));
            return;
          }
          
          // Serve CSS files
          if (req.url?.endsWith('.css')) {
            const cssPath = path.join(__dirname, '../templates', path.basename(req.url));
            
            try {
              const css = fs.readFileSync(cssPath, 'utf8');
              res.setHeader('Content-Type', 'text/css');
              res.end(css);
            } catch (error) {
              console.error(`Error reading CSS file: ${(error as Error).message}`);
              res.statusCode = 404;
              res.end('File not found');
            }
            return;
          }
          
          // Serve JavaScript files
          if (req.url?.endsWith('.js')) {
            const jsPath = path.join(__dirname, '../templates', path.basename(req.url));
            
            try {
              const js = fs.readFileSync(jsPath, 'utf8');
              res.setHeader('Content-Type', 'application/javascript');
              res.end(js);
            } catch (error) {
              console.error(`Error reading JavaScript file: ${(error as Error).message}`);
              res.statusCode = 404;
              res.end('File not found');
            }
            return;
          }
          
          // Serve HTML page
          if (req.url === '/' || req.url === '/index.html') {
            const templatePath = path.join(__dirname, '../templates/arxiv-manager.html');
            
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
          console.log(chalk.green(`arXiv papers management server running at ${url}`));
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
    
  // Keep the old command for backward compatibility
  program
    .command('bibtex-web')
    .description('Alias for "web" command (deprecated)')
    .option('-p, --port <port>', 'Port to run the server on', '3000')
    .action((options) => {
      console.log(chalk.yellow('Note: "bibtex-web" command is deprecated. Please use "web" instead.'));
      program.commands.find(cmd => cmd.name() === 'web')?.action(options);
    });
};

export default webCommand; 