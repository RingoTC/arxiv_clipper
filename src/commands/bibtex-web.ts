import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { Command } from 'commander';
import http from 'http';
import { CommandFunction, Paper } from '../types';
import open from 'open';
import { download } from './download';
import { homedir } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { paperDB } from '../models/Paper';
import { openPaperDirectory, openKnowledgeBase } from './open';
import { logger, requestLoggerMiddleware } from '../utils/logger';
import { extractArxivId, getPaperMetadata, downloadPdf, downloadSource, createPaperDirectory, saveBibTeX, getBibTeX } from '../utils/arxiv';
import { PAPERS_DIR } from '../utils/config';

const execAsync = promisify(exec);

// Define KB_DIR (Knowledge Base Directory)
const KB_DIR = path.join(PAPERS_DIR, 'knowledge-base');

// Ensure KB_DIR exists
fs.ensureDirSync(KB_DIR);

const webCommand: CommandFunction = (program: Command) => {
  program
    .command('web')
    .description('Start a web server for managing arXiv papers with all adown operations')
    .option('-p, --port <port>', 'Port to run the server on', '3000')
    .action(async (options: { port: string }) => {
      try {
        const port = parseInt(options.port, 10);
        
        logger.info('Starting arXiv papers management web server', { port });
        console.log(chalk.blue('Starting arXiv papers management web server...'));
        
        // Create HTTP server
        const server = http.createServer(async (req, res) => {
          // Apply request logger middleware
          requestLoggerMiddleware(req, res);
          
          // Set CORS headers for all responses
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE, PATCH');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Trace-ID');
          
          // Handle OPTIONS requests (for CORS preflight)
          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }
          
          // API endpoints
          if (req.url?.startsWith('/api/')) {
            // Logs API endpoint
            if (req.url === '/api/logs' && req.method === 'POST') {
              let body = '';
              let bodySize = 0;
              const maxBodySize = 1024 * 1024; // 1MB limit
              
              req.on('data', chunk => {
                bodySize += chunk.length;
                
                // Check if body size exceeds limit
                if (bodySize > maxBodySize) {
                  logger.warn('Log request body too large', { bodySize });
                  res.statusCode = 413; // Payload Too Large
                  res.setHeader('Content-Type', 'application/json');
                  res.end(safeJsonStringify({ error: 'Log message too large' }));
                  req.destroy(); // Abort the request
                  return;
                }
                
                body += chunk.toString();
              });
              
              req.on('end', () => {
                try {
                  const logEntry = JSON.parse(body);
                  
                  // Log the frontend log entry using the backend logger
                  const { level, message, context, traceId } = logEntry;
                  
                  // Truncate message if it's too large
                  const truncatedMessage = typeof message === 'string' && message.length > 10000 
                    ? message.substring(0, 10000) + '... [truncated]' 
                    : message;
                  
                  if (level && truncatedMessage) {
                    switch (level.toUpperCase()) {
                      case 'DEBUG':
                        logger.debug(truncatedMessage, { ...context, source: 'frontend', messageSize: message?.length }, traceId);
                        break;
                      case 'INFO':
                        logger.info(truncatedMessage, { ...context, source: 'frontend', messageSize: message?.length }, traceId);
                        break;
                      case 'WARN':
                        logger.warn(truncatedMessage, { ...context, source: 'frontend', messageSize: message?.length }, traceId);
                        break;
                      case 'ERROR':
                        logger.error(truncatedMessage, { ...context, source: 'frontend', messageSize: message?.length }, traceId);
                        break;
                      default:
                        logger.info(truncatedMessage, { ...context, source: 'frontend', level, messageSize: message?.length }, traceId);
                    }
                  }
                  
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(safeJsonStringify({ success: true }));
                } catch (error) {
                  logger.error('Failed to process frontend log', { error: (error as Error).message, bodySize });
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(safeJsonStringify({ error: 'Invalid log entry' }));
                }
              });
              
              return;
            }
            
            // Get papers list
            if (req.url?.startsWith('/api/papers') && req.method === 'GET') {
              try {
                // Parse query parameters for pagination
                const url = new URL(req.url, `http://${req.headers.host}`);
                const page = parseInt(url.searchParams.get('page') || '1', 10);
                const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);
                const tag = url.searchParams.get('tag') || undefined;
                const search = url.searchParams.get('search') || undefined;
                
                logger.info('Fetching papers', { page, pageSize, tag, search });
                
                let result;
                if (search) {
                  // Search with keywords
                  result = await paperDB.searchPapers(search, tag, page, pageSize);
                } else if (tag) {
                  // Filter by tag
                  result = await paperDB.getByTagPaginated(tag, page, pageSize);
                } else {
                  // Get all papers
                  result = await paperDB.getAllPaginated(page, pageSize);
                }
                
                logger.debug('Papers fetched', { count: result.papers.length, total: result.total });
                
                // Clean paper objects to ensure they don't have problematic fields
                const cleanPapers = result.papers.map(paper => {
                  // Create a clean copy of the paper object with type assertion
                  const cleanPaper: any = { ...paper };
                  
                  // Ensure abstract is not too large
                  if (cleanPaper.abstract && cleanPaper.abstract.length > 10000) {
                    cleanPaper.abstract = cleanPaper.abstract.substring(0, 10000) + '... [truncated]';
                  }
                  
                  // Ensure authors is a string
                  if (Array.isArray(cleanPaper.authors)) {
                    cleanPaper.authors = cleanPaper.authors.join(', ');
                  }
                  
                  // Ensure categories is a string
                  if (Array.isArray(cleanPaper.categories)) {
                    cleanPaper.categories = cleanPaper.categories.join(', ');
                  }
                  
                  return cleanPaper;
                });
                
                // Add pagination metadata
                const response = {
                  papers: cleanPapers,
                  pagination: {
                    total: result.total,
                    page,
                    pageSize,
                    totalPages: Math.ceil(result.total / pageSize)
                  }
                };
                
                res.setHeader('Content-Type', 'application/json');
                
                // Use safe JSON stringify to handle potentially large strings
                const jsonResponse = safeJsonStringify(response);
                logger.debug('Sending papers response', { responseSize: jsonResponse.length });
                res.end(jsonResponse);
              } catch (error) {
                logger.error('Error fetching papers', { error: (error as Error).message, stack: (error as Error).stack });
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(safeJsonStringify({ error: (error as Error).message }));
              }
              return;
            }
            
            // Get all tags
            if (req.url === '/api/tags' && req.method === 'GET') {
              try {
                const papers = await paperDB.getAll();
                const tags = new Set<string>();
                
                papers.forEach(paper => {
                  if (paper.tag) {
                    tags.add(paper.tag);
                  }
                });
                
                res.setHeader('Content-Type', 'application/json');
                res.end(safeJsonStringify({ tags: Array.from(tags) }));
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
                    res.setHeader('Content-Type', 'application/json');
                    res.end(safeJsonStringify({ error: 'URL is required' }));
                    return;
                  }
                  
                  // Download paper
                  const paper = await downloadPaper(url, tag || 'default');
                  
                  // Add GitHub URL if provided
                  if (githubUrl) {
                    paper.githubUrl = githubUrl;
                    
                    // Clone GitHub repository
                    try {
                      const repoPath = await cloneGitHubRepo(githubUrl, paper.id);
                      paper.localGithubPath = repoPath;
                    } catch (error) {
                      logger.error('Failed to clone GitHub repository', { error: (error as Error).message });
                      // Continue without GitHub repo
                    }
                  }
                  
                  // Save to database
                  await paperDB.add(paper);
                  
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(safeJsonStringify({ 
                    success: true,
                    id: paper.id,
                    title: paper.title
                  }));
                } catch (error) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(safeJsonStringify({ error: (error as Error).message }));
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
                  const result = await paperDB.searchPapers(paperId);
                  if (result.papers.length === 0) {
                    res.statusCode = 404;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(safeJsonStringify({ error: 'Paper not found' }));
                    return;
                  }
                  
                  const paper = result.papers[0];
                  
                  // Update paper
                  paper.githubUrl = githubUrl;
                  
                  // Save to database
                  await paperDB.add(paper);
                  
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(safeJsonStringify({ success: true }));
                } catch (error) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(safeJsonStringify({ error: (error as Error).message }));
                }
              });
              
              return;
            }
            
            // Clone GitHub repository
            if (req.url?.startsWith('/api/github/clone/') && req.method === 'POST') {
              const paperId = req.url.replace('/api/github/clone/', '');
              
              try {
                // Get paper
                const result = await paperDB.searchPapers(paperId);
                if (result.papers.length === 0) {
                  res.statusCode = 404;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(safeJsonStringify({ error: 'Paper not found' }));
                  return;
                }
                
                const paper = result.papers[0];
                
                if (!paper.githubUrl) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(safeJsonStringify({ error: 'GitHub URL not set for this paper' }));
                  return;
                }
                
                // Clone repository
                const repoPath = await cloneGitHubRepo(paper.githubUrl, paper.id);
                
                // Update paper
                paper.localGithubPath = repoPath;
                await paperDB.add(paper);
                
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(safeJsonStringify({ 
                  success: true,
                  localGithubPath: repoPath
                }));
              } catch (error) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(safeJsonStringify({ error: (error as Error).message }));
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
                    res.end(safeJsonStringify({ error: 'Paper IDs are required' }));
                    return;
                  }
                  
                  await paperDB.deletePapers(ids);
                  
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(safeJsonStringify({ success: true }));
                } catch (error) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(safeJsonStringify({ error: (error as Error).message }));
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
                  res.end(safeJsonStringify({ error: 'PDF not found' }));
                  return;
                }
                
                // Open PDF with default application
                open(paper.localPdfPath).catch(console.error);
                
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(safeJsonStringify({ success: true }));
              } catch (error) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(safeJsonStringify({ error: (error as Error).message }));
              }
              return;
            }
            
            // Extract source
            if (req.url?.startsWith('/api/source/') && req.method === 'GET') {
              const paperId = req.url.replace('/api/source/', '');
              
              try {
                const papers = await paperDB.getAll();
                const paper = papers.find(p => p.id === paperId);
                
                if (!paper) {
                  res.statusCode = 404;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(safeJsonStringify({ error: 'Paper not found' }));
                  return;
                }
                
                // Extract source
                const sourcePath = await extractSource(paper);
                
                // Update paper with source path
                paper.localSourcePath = sourcePath;
                await paperDB.add(paper);
                
                // Open source directory
                open(sourcePath).catch(console.error);
                
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(safeJsonStringify({ success: true }));
              } catch (error) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(safeJsonStringify({ error: (error as Error).message }));
              }
              return;
            }
            
            // Open directory
            if (req.url?.startsWith('/api/open/') && req.method === 'GET') {
              const paperId = req.url.replace('/api/open/', '');
              
              try {
                await openPaperDirectory(paperId);
                
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(safeJsonStringify({ success: true }));
              } catch (error) {
                logger.error('Error opening paper directory', { error: (error as Error).message, paperId });
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(safeJsonStringify({ error: (error as Error).message }));
              }
              
              return;
            }
            
            // Open knowledge base
            if (req.url === '/api/open-kb' && req.method === 'GET') {
              try {
                // Open knowledge base directory
                open(PAPERS_DIR).catch(console.error);
                
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(safeJsonStringify({ success: true }));
              } catch (error) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(safeJsonStringify({ error: (error as Error).message }));
              }
              return;
            }
            
            // If no API endpoint matched
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

// Helper function to safely stringify JSON by truncating large strings
function safeJsonStringify(obj: any, maxLength: number = 500000): string {
  // Process object to truncate large strings
  const processValue = (value: any): any => {
    if (typeof value === 'string' && value.length > maxLength) {
      logger.warn(`Truncating large string (length: ${value.length})`, { maxLength });
      return value.substring(0, maxLength) + '... [truncated]';
    }
    
    if (Array.isArray(value)) {
      return value.map(processValue);
    }
    
    if (value !== null && typeof value === 'object') {
      return processObject(value);
    }
    
    return value;
  };
  
  const processObject = (obj: any): any => {
    const result: any = {};
    
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = processValue(obj[key]);
      }
    }
    
    return result;
  };
  
  try {
    // Process the object to truncate large strings
    const processed = processValue(obj);
    // Then stringify it
    const jsonString = JSON.stringify(processed);
    logger.debug(`JSON response size: ${jsonString.length} bytes`);
    return jsonString;
  } catch (error) {
    logger.error('Error in safeJsonStringify', { error: (error as Error).message });
    // Fallback to a simple error message
    return JSON.stringify({ error: 'Failed to serialize response data' });
  }
}

// Helper function to download a paper
async function downloadPaper(url: string, tag: string): Promise<Paper> {
  try {
    // Extract arXiv ID from URL
    const arxivId = extractArxivId(url);
    
    // Get paper metadata
    const paper = await getPaperMetadata(arxivId);
    
    // Create paper directory
    const paperDir = createPaperDirectory(paper, tag);
    
    // Download PDF
    const pdfPath = await downloadPdf(arxivId, paperDir);
    paper.localPdfPath = pdfPath;
    
    // Download source
    const sourcePath = await downloadSource(arxivId, paperDir);
    paper.localSourcePath = sourcePath;
    
    // Get and save BibTeX
    const bibtex = await getBibTeX(arxivId);
    const bibtexPath = await saveBibTeX(bibtex, paperDir);
    paper.bibtex = bibtex;
    
    // Set tag
    paper.tag = tag;
    
    return paper;
  } catch (error) {
    logger.error('Error downloading paper', { error: (error as Error).message });
    throw error;
  }
}

// Helper function to clone a GitHub repository
async function cloneGitHubRepo(githubUrl: string, paperId: string) {
  // Get paper directory
  const papers = await paperDB.getAll();
  const paper = papers.find(p => p.id === paperId);
  
  if (!paper || !paper.localPdfPath) {
    throw new Error('Paper not found or PDF not downloaded');
  }
  
  // Create GitHub directory
  const paperDir = path.dirname(paper.localPdfPath);
  const githubDir = path.join(paperDir, 'github');
  await fs.ensureDir(githubDir);
  
  // Clone repository
  await execAsync(`git clone "${githubUrl}" "${githubDir}"`);
  
  return githubDir;
}

// Helper function to extract source files
async function extractSource(paper: any) {
  if (!paper.localSourcePath) {
    throw new Error('Source file not found');
  }
  
  // Extract source to a directory
  const extractDir = path.join(path.dirname(paper.localSourcePath), 'source');
  await fs.ensureDir(extractDir);
  
  // Extract the source archive
  await execAsync(`tar -xzf "${paper.localSourcePath}" -C "${extractDir}"`);
  
  return extractDir;
}

export default webCommand; 