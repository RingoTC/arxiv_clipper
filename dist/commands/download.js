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
        let arxivId = '';
        const urlMatch = url.match(/arxiv\.org\/(?:abs|pdf)\/([^\/]+)/i);
        if (urlMatch && urlMatch[1]) {
            arxivId = urlMatch[1].split('v')[0];
        }
        else {
            arxivId = url.split('/').pop()?.split('v')[0] || '';
        }
        if (!arxivId) {
            throw new Error('Invalid arXiv URL');
        }
        spinner.text = `Downloading paper with ID: ${arxivId}`;
        const browser = await puppeteer_1.default.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        const downloadPath = (0, path_1.join)((0, os_1.homedir)(), '.arxiv-downloader', 'papers', options.tag);
        await (0, promises_1.mkdir)(downloadPath, { recursive: true });
        await page.goto(`https://arxiv.org/abs/${arxivId}`, {
            waitUntil: 'networkidle0',
            timeout: 60000
        });
        spinner.text = 'Extracting paper metadata...';
        const titleElement = await page.waitForSelector('h1.title');
        const title = await titleElement?.evaluate(el => el.textContent?.replace('Title:', '').trim()) || '';
        const authorsElement = await page.waitForSelector('div.authors');
        const authors = await authorsElement?.evaluate(el => {
            const authorsText = el.textContent?.replace('Authors:', '').trim() || '';
            return authorsText.split(',').map(author => author.trim());
        }) || [];
        const abstractElement = await page.waitForSelector('blockquote.abstract');
        const abstract = await abstractElement?.evaluate(el => el.textContent?.replace('Abstract:', '').trim()) || '';
        const safeTitle = title.replace(/[\/\\:*?"<>|]/g, '_');
        const paperDir = (0, path_1.join)(downloadPath, safeTitle);
        await (0, promises_1.mkdir)(paperDir, { recursive: true });
        spinner.text = 'Downloading PDF...';
        const pdfUrl = `https://arxiv.org/pdf/${arxivId}.pdf`;
        const pdfResponse = await (0, axios_1.default)({
            method: 'get',
            url: pdfUrl,
            responseType: 'stream',
            timeout: 30000
        });
        const pdfPath = (0, path_1.join)(paperDir, `${arxivId}.pdf`);
        const pdfWriter = fs_1.default.createWriteStream(pdfPath);
        pdfResponse.data.pipe(pdfWriter);
        await new Promise((resolve, reject) => {
            pdfWriter.on('finish', () => resolve());
            pdfWriter.on('error', (err) => reject(err));
        });
        spinner.text = 'Downloading source...';
        const sourceUrl = `https://arxiv.org/e-print/${arxivId}`;
        const sourceResponse = await (0, axios_1.default)({
            method: 'get',
            url: sourceUrl,
            responseType: 'stream',
            timeout: 30000
        });
        const sourcePath = (0, path_1.join)(paperDir, `${arxivId}.tar.gz`);
        const sourceWriter = fs_1.default.createWriteStream(sourcePath);
        sourceResponse.data.pipe(sourceWriter);
        await new Promise((resolve, reject) => {
            sourceWriter.on('finish', () => resolve());
            sourceWriter.on('error', (err) => reject(err));
        });
        await browser.close();
        spinner.text = 'Saving to database...';
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
        return { success: true, title, id: arxivId };
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Failed to download paper'));
        console.error(error);
        throw error;
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
