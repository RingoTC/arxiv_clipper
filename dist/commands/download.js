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
        await browser.close();
        // Save to database
        await Paper_1.paperDB.add({
            id: arxivId,
            title,
            authors,
            abstract,
            categories: [],
            publishedDate: new Date().toISOString(),
            updatedDate: new Date().toISOString(),
            url: url,
            tag: options.tag,
            pdfUrl,
            sourceUrl,
            localPdfPath: pdfPath,
            localSourcePath: sourcePath,
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
        .action((url, options) => {
        download(url, { tag: options.tag });
    });
};
exports.default = downloadCommand;
