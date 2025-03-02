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
const child_process_1 = require("child_process");
const util_1 = require("util");
const Paper_1 = require("../models/Paper");
const open_2 = require("./open");
const logger_1 = require("../utils/logger");
const arxiv_1 = require("../utils/arxiv");
const config_1 = require("../utils/config");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
// Define KB_DIR (Knowledge Base Directory)
const KB_DIR = path_1.default.join(config_1.PAPERS_DIR, 'knowledge-base');
// Ensure KB_DIR exists
fs_extra_1.default.ensureDirSync(KB_DIR);
const webCommand = (program) => {
    program
        .command('web')
        .description('Start a web server for managing arXiv papers with all adown operations')
        .option('-p, --port <port>', 'Port to run the server on', '3000')
        .action(async (options) => {
        try {
            const port = parseInt(options.port, 10);
            logger_1.logger.info('Starting arXiv papers management web server', { port });
            console.log(chalk_1.default.blue('Starting arXiv papers management web server...'));
            // Create HTTP server
            const server = http_1.default.createServer(async (req, res) => {
                // Apply request logger middleware
                (0, logger_1.requestLoggerMiddleware)(req, res);
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
                                logger_1.logger.warn('Log request body too large', { bodySize });
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
                                            logger_1.logger.debug(truncatedMessage, { ...context, source: 'frontend', messageSize: message?.length }, traceId);
                                            break;
                                        case 'INFO':
                                            logger_1.logger.info(truncatedMessage, { ...context, source: 'frontend', messageSize: message?.length }, traceId);
                                            break;
                                        case 'WARN':
                                            logger_1.logger.warn(truncatedMessage, { ...context, source: 'frontend', messageSize: message?.length }, traceId);
                                            break;
                                        case 'ERROR':
                                            logger_1.logger.error(truncatedMessage, { ...context, source: 'frontend', messageSize: message?.length }, traceId);
                                            break;
                                        default:
                                            logger_1.logger.info(truncatedMessage, { ...context, source: 'frontend', level, messageSize: message?.length }, traceId);
                                    }
                                }
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(safeJsonStringify({ success: true }));
                            }
                            catch (error) {
                                logger_1.logger.error('Failed to process frontend log', { error: error.message, bodySize });
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
                            logger_1.logger.info('Fetching papers', { page, pageSize, tag, search });
                            let result;
                            if (search) {
                                // Search with keywords
                                result = await Paper_1.paperDB.searchPapers(search, tag, page, pageSize);
                            }
                            else if (tag) {
                                // Filter by tag
                                result = await Paper_1.paperDB.getByTagPaginated(tag, page, pageSize);
                            }
                            else {
                                // Get all papers
                                result = await Paper_1.paperDB.getAllPaginated(page, pageSize);
                            }
                            logger_1.logger.debug('Papers fetched', { count: result.papers.length, total: result.total });
                            // Clean paper objects to ensure they don't have problematic fields
                            const cleanPapers = result.papers.map(paper => {
                                // Create a clean copy of the paper object with type assertion
                                const cleanPaper = { ...paper };
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
                            logger_1.logger.debug('Sending papers response', { responseSize: jsonResponse.length });
                            res.end(jsonResponse);
                        }
                        catch (error) {
                            logger_1.logger.error('Error fetching papers', { error: error.message, stack: error.stack });
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(safeJsonStringify({ error: error.message }));
                        }
                        return;
                    }
                    // Get all tags
                    if (req.url === '/api/tags' && req.method === 'GET') {
                        try {
                            const papers = await Paper_1.paperDB.getAll();
                            const tags = new Set();
                            papers.forEach(paper => {
                                if (paper.tag) {
                                    tags.add(paper.tag);
                                }
                            });
                            res.setHeader('Content-Type', 'application/json');
                            res.end(safeJsonStringify({ tags: Array.from(tags) }));
                        }
                        catch (error) {
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ error: error.message }));
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
                                    }
                                    catch (error) {
                                        logger_1.logger.error('Failed to clone GitHub repository', { error: error.message });
                                        // Continue without GitHub repo
                                    }
                                }
                                // Save to database
                                await Paper_1.paperDB.add(paper);
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(safeJsonStringify({
                                    success: true,
                                    id: paper.id,
                                    title: paper.title
                                }));
                            }
                            catch (error) {
                                res.statusCode = 500;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(safeJsonStringify({ error: error.message }));
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
                                const result = await Paper_1.paperDB.searchPapers(paperId);
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
                                await Paper_1.paperDB.add(paper);
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(safeJsonStringify({ success: true }));
                            }
                            catch (error) {
                                res.statusCode = 500;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(safeJsonStringify({ error: error.message }));
                            }
                        });
                        return;
                    }
                    // Clone GitHub repository
                    if (req.url?.startsWith('/api/github/clone/') && req.method === 'POST') {
                        const paperId = req.url.replace('/api/github/clone/', '');
                        try {
                            // Get paper
                            const result = await Paper_1.paperDB.searchPapers(paperId);
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
                            await Paper_1.paperDB.add(paper);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(safeJsonStringify({
                                success: true,
                                localGithubPath: repoPath
                            }));
                        }
                        catch (error) {
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(safeJsonStringify({ error: error.message }));
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
                                await Paper_1.paperDB.deletePapers(ids);
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(safeJsonStringify({ success: true }));
                            }
                            catch (error) {
                                res.statusCode = 500;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(safeJsonStringify({ error: error.message }));
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
                                res.end(safeJsonStringify({ error: 'PDF not found' }));
                                return;
                            }
                            // Open PDF with default application
                            (0, open_1.default)(paper.localPdfPath).catch(console.error);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(safeJsonStringify({ success: true }));
                        }
                        catch (error) {
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(safeJsonStringify({ error: error.message }));
                        }
                        return;
                    }
                    // Extract source
                    if (req.url?.startsWith('/api/source/') && req.method === 'GET') {
                        const paperId = req.url.replace('/api/source/', '');
                        try {
                            const papers = await Paper_1.paperDB.getAll();
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
                            await Paper_1.paperDB.add(paper);
                            // Open source directory
                            (0, open_1.default)(sourcePath).catch(console.error);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(safeJsonStringify({ success: true }));
                        }
                        catch (error) {
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(safeJsonStringify({ error: error.message }));
                        }
                        return;
                    }
                    // Open directory
                    if (req.url?.startsWith('/api/open/') && req.method === 'GET') {
                        const paperId = req.url.replace('/api/open/', '');
                        try {
                            await (0, open_2.openPaperDirectory)(paperId);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(safeJsonStringify({ success: true }));
                        }
                        catch (error) {
                            logger_1.logger.error('Error opening paper directory', { error: error.message, paperId });
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(safeJsonStringify({ error: error.message }));
                        }
                        return;
                    }
                    // Open knowledge base
                    if (req.url === '/api/open-kb' && req.method === 'GET') {
                        try {
                            // Open knowledge base directory
                            (0, open_1.default)(config_1.PAPERS_DIR).catch(console.error);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(safeJsonStringify({ success: true }));
                        }
                        catch (error) {
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(safeJsonStringify({ error: error.message }));
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
                    const cssPath = path_1.default.join(__dirname, '../templates', path_1.default.basename(req.url));
                    try {
                        const css = fs_extra_1.default.readFileSync(cssPath, 'utf8');
                        res.setHeader('Content-Type', 'text/css');
                        res.end(css);
                    }
                    catch (error) {
                        console.error(`Error reading CSS file: ${error.message}`);
                        res.statusCode = 404;
                        res.end('File not found');
                    }
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
// Helper function to safely stringify JSON by truncating large strings
function safeJsonStringify(obj, maxLength = 500000) {
    // Process object to truncate large strings
    const processValue = (value) => {
        if (typeof value === 'string' && value.length > maxLength) {
            logger_1.logger.warn(`Truncating large string (length: ${value.length})`, { maxLength });
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
    const processObject = (obj) => {
        const result = {};
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
        logger_1.logger.debug(`JSON response size: ${jsonString.length} bytes`);
        return jsonString;
    }
    catch (error) {
        logger_1.logger.error('Error in safeJsonStringify', { error: error.message });
        // Fallback to a simple error message
        return JSON.stringify({ error: 'Failed to serialize response data' });
    }
}
// Helper function to download a paper
async function downloadPaper(url, tag) {
    try {
        // Extract arXiv ID from URL
        const arxivId = (0, arxiv_1.extractArxivId)(url);
        // Get paper metadata
        const paper = await (0, arxiv_1.getPaperMetadata)(arxivId);
        // Create paper directory
        const paperDir = (0, arxiv_1.createPaperDirectory)(paper, tag);
        // Download PDF
        const pdfPath = await (0, arxiv_1.downloadPdf)(arxivId, paperDir);
        paper.localPdfPath = pdfPath;
        // Download source
        const sourcePath = await (0, arxiv_1.downloadSource)(arxivId, paperDir);
        paper.localSourcePath = sourcePath;
        // Get and save BibTeX
        const bibtex = await (0, arxiv_1.getBibTeX)(arxivId);
        const bibtexPath = await (0, arxiv_1.saveBibTeX)(bibtex, paperDir);
        paper.bibtex = bibtex;
        // Set tag
        paper.tag = tag;
        return paper;
    }
    catch (error) {
        logger_1.logger.error('Error downloading paper', { error: error.message });
        throw error;
    }
}
// Helper function to clone a GitHub repository
async function cloneGitHubRepo(githubUrl, paperId) {
    // Get paper directory
    const papers = await Paper_1.paperDB.getAll();
    const paper = papers.find(p => p.id === paperId);
    if (!paper || !paper.localPdfPath) {
        throw new Error('Paper not found or PDF not downloaded');
    }
    // Create GitHub directory
    const paperDir = path_1.default.dirname(paper.localPdfPath);
    const githubDir = path_1.default.join(paperDir, 'github');
    await fs_extra_1.default.ensureDir(githubDir);
    // Clone repository
    await execAsync(`git clone "${githubUrl}" "${githubDir}"`);
    return githubDir;
}
// Helper function to extract source files
async function extractSource(paper) {
    if (!paper.localSourcePath) {
        throw new Error('Source file not found');
    }
    // Extract source to a directory
    const extractDir = path_1.default.join(path_1.default.dirname(paper.localSourcePath), 'source');
    await fs_extra_1.default.ensureDir(extractDir);
    // Extract the source archive
    await execAsync(`tar -xzf "${paper.localSourcePath}" -C "${extractDir}"`);
    return extractDir;
}
exports.default = webCommand;
