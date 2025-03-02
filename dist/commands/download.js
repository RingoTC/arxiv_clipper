"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.download = download;
const puppeteer_1 = __importDefault(require("puppeteer"));
const path_1 = require("path");
const os_1 = require("os");
const promises_1 = require("fs/promises");
const Paper_1 = require("../models/Paper");
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function download(url, options) {
    const spinner = (0, ora_1.default)('Downloading paper...').start();
    try {
        const arxivId = url.split('/').pop()?.replace('v', '') || '';
        if (!arxivId) {
            throw new Error('Invalid arXiv URL');
        }
        const browser = await puppeteer_1.default.launch({ headless: 'new' });
        const page = await browser.newPage();
        // Configure download path
        const downloadPath = (0, path_1.join)((0, os_1.homedir)(), 'Development', 'arxiv', options.tag);
        await (0, promises_1.mkdir)(downloadPath, { recursive: true });
        await page.goto(url, { waitUntil: 'networkidle0' });
        // Get paper title
        const titleElement = await page.waitForSelector('h1.title');
        const title = await titleElement?.evaluate(el => el.textContent?.replace('Title:', '').trim()) || '';
        // Get authors
        const authorsElement = await page.waitForSelector('div.authors');
        const authors = await authorsElement?.evaluate(el => {
            const authorsText = el.textContent?.replace('Authors:', '').trim() || '';
            return authorsText.split(',').map(author => author.trim());
        }) || [];
        // Get abstract
        const abstractElement = await page.waitForSelector('blockquote.abstract');
        const abstract = await abstractElement?.evaluate(el => el.textContent?.replace('Abstract:', '').trim()) || '';
        // Extract categories/subjects
        const categories = await page.evaluate(() => {
            const subjectsElement = document.querySelector('td.tablecell.subjects');
            if (subjectsElement) {
                const subjectsText = subjectsElement.textContent || '';
                // Split by semicolon and remove any leading/trailing whitespace
                return subjectsText.split(';').map(cat => cat.trim());
            }
            return [];
        });
        console.log(`Categories: ${categories.join(', ')}`);
        // Create paper directory
        const paperDir = (0, path_1.join)(downloadPath, title);
        await (0, promises_1.mkdir)(paperDir, { recursive: true });
        // Get PDF URL
        const pdfUrl = `https://arxiv.org/pdf/${arxivId}.pdf`;
        // Download PDF using axios
        const pdfResponse = await (0, axios_1.default)({
            method: 'get',
            url: pdfUrl,
            responseType: 'stream'
        });
        const pdfPath = (0, path_1.join)(paperDir, `${arxivId}.pdf`);
        const pdfWriter = fs_1.default.createWriteStream(pdfPath);
        pdfResponse.data.pipe(pdfWriter);
        await new Promise((resolve, reject) => {
            pdfWriter.on('finish', () => resolve());
            pdfWriter.on('error', (err) => reject(err));
        });
        // Get source URL
        const sourceUrl = `https://arxiv.org/e-print/${arxivId}`;
        // Download source using axios
        const sourceResponse = await (0, axios_1.default)({
            method: 'get',
            url: sourceUrl,
            responseType: 'stream'
        });
        const sourcePath = (0, path_1.join)(paperDir, `${arxivId}.tar.gz`);
        const sourceWriter = fs_1.default.createWriteStream(sourcePath);
        sourceResponse.data.pipe(sourceWriter);
        await new Promise((resolve, reject) => {
            sourceWriter.on('finish', () => resolve());
            sourceWriter.on('error', (err) => reject(err));
        });
        // Handle GitHub repository download if provided
        let githubUrl;
        let localGithubPath;
        if (options.github) {
            githubUrl = options.github;
            spinner.text = 'Downloading GitHub repository...';
            // Create GitHub directory
            const githubDir = (0, path_1.join)(paperDir, 'github');
            await (0, promises_1.mkdir)(githubDir, { recursive: true });
            // Clone the repository
            try {
                // Properly quote the path to handle spaces
                await execAsync(`git clone "${githubUrl}" "${githubDir}"`);
                localGithubPath = githubDir;
                spinner.succeed(chalk_1.default.green(`Successfully cloned GitHub repository: ${githubUrl}`));
                spinner.start('Finalizing paper download...');
            }
            catch (error) {
                console.error(chalk_1.default.yellow(`Warning: Failed to clone GitHub repository: ${githubUrl}`));
                console.error(error);
            }
        }
        await browser.close();
        // Save to database
        await Paper_1.paperDB.add({
            id: arxivId,
            title,
            authors,
            abstract,
            categories,
            publishedDate: new Date().toISOString(),
            updatedDate: new Date().toISOString(),
            url: url,
            tag: options.tag,
            pdfUrl,
            sourceUrl,
            githubUrl,
            localPdfPath: pdfPath,
            localSourcePath: sourcePath,
            localGithubPath,
            dateAdded: new Date().toISOString(),
            arxivId
        });
        spinner.succeed(chalk_1.default.green(`Successfully downloaded paper: ${title}`));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Failed to download paper'));
        console.error(error);
    }
}
const downloadCommand = (program) => {
    program
        .command('download <url>')
        .description('Download a paper from arXiv')
        .option('-t, --tag <tag>', 'Tag for organizing papers', 'default')
        .option('--github <url>', 'GitHub repository URL to download along with the paper')
        .action((url, options) => {
        download(url, { tag: options.tag, github: options.github });
    });
};
exports.default = downloadCommand;
