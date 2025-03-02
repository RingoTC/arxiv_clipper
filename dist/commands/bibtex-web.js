"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const open_1 = __importDefault(require("open"));
const download_1 = require("./download");
const child_process_1 = require("child_process");
const util_1 = require("util");
const Paper_1 = require("../models/Paper");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const webCommand = (program) => {
    program
        .command('web')
        .description('Start a web server for managing arXiv papers with all adown operations')
        .option('-p, --port <port>', 'Port to run the server on', '3000')
        .action(async (options) => {
        try {
            const port = parseInt(options.port, 10);
            console.log(chalk_1.default.blue('Starting arXiv papers management web server...'));
            // Create HTTP server
            const server = http_1.default.createServer(async (req, res) => {
                // Set CORS headers for all responses
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
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
                            const papers = await Paper_1.paperDB.getAll();
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify(papers));
                        }
                        catch (error) {
                            console.error(`Error fetching papers: ${error.message}`);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ error: 'Failed to fetch papers' }));
                        }
                        return;
                    }
                    // Download a paper
                    if (req.url === '/api/papers' && req.method === 'POST') {
                        let body = '';
                        req.on('data', chunk => {
                            body += chunk.toString();
                        });
                        req.on('end', async () => {
                            try {
                                const { url, tag } = JSON.parse(body);
                                if (!url) {
                                    res.statusCode = 400;
                                    res.end(JSON.stringify({ error: 'URL is required' }));
                                    return;
                                }
                                // Use the download function from download.ts
                                await (0, download_1.download)(url, { tag: tag || 'default' });
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({ success: true }));
                            }
                            catch (error) {
                                res.statusCode = 500;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({ error: error.message }));
                            }
                        });
                        return;
                    }
                    // Delete papers
                    if (req.url === '/api/papers' && req.method === 'DELETE') {
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
                                await Paper_1.paperDB.deletePapers(ids);
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({ success: true }));
                            }
                            catch (error) {
                                res.statusCode = 500;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({ error: error.message }));
                            }
                        });
                        return;
                    }
                    // Open PDF
                    if (req.url?.startsWith('/api/pdf/') && req.method === 'GET') {
                        const paperId = req.url.replace('/api/pdf/', '');
                        try {
                            const papers = await Paper_1.paperDB.getAll();
                            const paper = papers.find(p => p.id === paperId);
                            if (!paper || !paper.localPdfPath) {
                                res.statusCode = 404;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({ error: 'PDF not found' }));
                                return;
                            }
                            // Open PDF with default application
                            (0, open_1.default)(paper.localPdfPath).catch(console.error);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ success: true }));
                        }
                        catch (error) {
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ error: error.message }));
                        }
                        return;
                    }
                    // Extract source
                    if (req.url?.startsWith('/api/source/') && req.method === 'GET') {
                        const paperId = req.url.replace('/api/source/', '');
                        try {
                            const papers = await Paper_1.paperDB.getAll();
                            const paper = papers.find(p => p.id === paperId);
                            if (!paper || !paper.localSourcePath) {
                                res.statusCode = 404;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({ error: 'Source not found' }));
                                return;
                            }
                            // Extract source to a directory
                            const extractDir = path_1.default.join(path_1.default.dirname(paper.localSourcePath), 'source');
                            await fs_extra_1.default.ensureDir(extractDir);
                            try {
                                await execAsync(`tar -xzf "${paper.localSourcePath}" -C "${extractDir}"`);
                                // Open the directory
                                (0, open_1.default)(extractDir).catch(console.error);
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({ success: true }));
                            }
                            catch (error) {
                                res.statusCode = 500;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({ error: error.message }));
                            }
                        }
                        catch (error) {
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ error: error.message }));
                        }
                        return;
                    }
                    // 404 for unknown API endpoints
                    res.statusCode = 404;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'API endpoint not found' }));
                    return;
                }
                // Serve JavaScript files
                if (req.url?.endsWith('.js')) {
                    const jsPath = path_1.default.join(__dirname, '../templates', path_1.default.basename(req.url));
                    try {
                        const js = fs_extra_1.default.readFileSync(jsPath, 'utf8');
                        res.setHeader('Content-Type', 'application/javascript');
                        res.end(js);
                    }
                    catch (error) {
                        console.error(`Error reading JavaScript file: ${error.message}`);
                        res.statusCode = 404;
                        res.end('File not found');
                    }
                    return;
                }
                // Serve HTML page
                if (req.url === '/' || req.url === '/index.html') {
                    const templatePath = path_1.default.join(__dirname, '../templates/arxiv-manager.html');
                    try {
                        const html = fs_extra_1.default.readFileSync(templatePath, 'utf8');
                        res.setHeader('Content-Type', 'text/html');
                        res.end(html);
                    }
                    catch (error) {
                        console.error(`Error reading template: ${error.message}`);
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
                console.log(chalk_1.default.green(`arXiv papers management server running at ${url}`));
                console.log(chalk_1.default.blue('Opening browser...'));
                // Open browser
                (0, open_1.default)(url).catch(() => {
                    console.log(chalk_1.default.yellow(`Could not open browser automatically. Please navigate to ${url}`));
                });
                console.log(chalk_1.default.gray('Press Ctrl+C to stop the server'));
            });
            // Handle server errors
            server.on('error', (error) => {
                if (error.code === 'EADDRINUSE') {
                    console.error(chalk_1.default.red(`Port ${port} is already in use. Try a different port with --port option.`));
                }
                else {
                    console.error(chalk_1.default.red(`Server error: ${error.message}`));
                }
                process.exit(1);
            });
        }
        catch (error) {
            console.error(chalk_1.default.red(`Error: ${error.message}`));
            process.exit(1);
        }
    });
    // Keep the old command for backward compatibility
    program
        .command('bibtex-web')
        .description('Alias for "web" command (deprecated)')
        .option('-p, --port <port>', 'Port to run the server on', '3000')
        .action((options) => {
        console.log(chalk_1.default.yellow('Note: "bibtex-web" command is deprecated. Please use "web" instead.'));
        program.commands.find(cmd => cmd.name() === 'web')?.action(options);
    });
};
exports.default = webCommand;
