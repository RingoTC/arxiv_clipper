"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const database_1 = require("../utils/database");
const open_1 = __importDefault(require("open"));
const bibtexWebCommand = (program) => {
    program
        .command('bibtex-web')
        .description('Start a web server for BibTeX export with search and selection')
        .option('-p, --port <port>', 'Port to run the server on', '3000')
        .action(async (options) => {
        try {
            const port = parseInt(options.port, 10);
            console.log(chalk_1.default.blue('Starting BibTeX web export server...'));
            // Create HTTP server
            const server = http_1.default.createServer((req, res) => {
                // Handle API requests
                if (req.url === '/api/papers') {
                    const papers = (0, database_1.findPapers)([]);
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(papers));
                    return;
                }
                // Serve HTML page
                if (req.url === '/' || req.url === '/index.html') {
                    const templatePath = path_1.default.join(__dirname, '../templates/bibtex-export.html');
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
                console.log(chalk_1.default.green(`BibTeX web export server running at ${url}`));
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
};
exports.default = bibtexWebCommand;
