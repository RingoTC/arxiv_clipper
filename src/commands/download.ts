import puppeteer from 'puppeteer';
import { join } from 'path';
import { homedir } from 'os';
import { mkdir } from 'fs/promises';
import { paperDB } from '../models/Paper';
import ora from 'ora';
import chalk from 'chalk';
import { Command } from 'commander';
import { CommandFunction } from '../types';
import axios from 'axios';
import fs from 'fs';

interface DownloadOptions {
  tag: string;
}

export async function download(url: string, options: DownloadOptions) {
  const spinner = ora('Downloading paper...').start();
  
  try {
    const arxivId = url.split('/').pop()?.replace('v', '') || '';
    if (!arxivId) {
      throw new Error('Invalid arXiv URL');
    }

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Configure download path
    const downloadPath = join(homedir(), 'Development', 'arxiv', options.tag);
    await mkdir(downloadPath, { recursive: true });
    
    await page.goto(url, { waitUntil: 'networkidle0' });

    // Get paper title
    const titleElement = await page.waitForSelector('h1.title');
    const title = await titleElement?.evaluate(el => (el as HTMLElement).textContent?.replace('Title:', '').trim()) || '';

    // Get authors
    const authorsElement = await page.waitForSelector('div.authors');
    const authors = await authorsElement?.evaluate(el => {
      const authorsText = (el as HTMLElement).textContent?.replace('Authors:', '').trim() || '';
      return authorsText.split(',').map(author => author.trim());
    }) || [];

    // Get abstract
    const abstractElement = await page.waitForSelector('blockquote.abstract');
    const abstract = await abstractElement?.evaluate(el => (el as HTMLElement).textContent?.replace('Abstract:', '').trim()) || '';

    // Create paper directory
    const paperDir = join(downloadPath, title);
    await mkdir(paperDir, { recursive: true });

    // Get PDF URL
    const pdfUrl = `https://arxiv.org/pdf/${arxivId}.pdf`;
    
    // Download PDF using axios
    const pdfResponse = await axios({
      method: 'get',
      url: pdfUrl,
      responseType: 'stream'
    });
    
    const pdfPath = join(paperDir, `${arxivId}.pdf`);
    const pdfWriter = fs.createWriteStream(pdfPath);
    pdfResponse.data.pipe(pdfWriter);
    
    await new Promise<void>((resolve, reject) => {
      pdfWriter.on('finish', () => resolve());
      pdfWriter.on('error', (err) => reject(err));
    });

    // Get source URL
    const sourceUrl = `https://arxiv.org/e-print/${arxivId}`;
    
    // Download source using axios
    const sourceResponse = await axios({
      method: 'get',
      url: sourceUrl,
      responseType: 'stream'
    });
    
    const sourcePath = join(paperDir, `${arxivId}.tar.gz`);
    const sourceWriter = fs.createWriteStream(sourcePath);
    sourceResponse.data.pipe(sourceWriter);
    
    await new Promise<void>((resolve, reject) => {
      sourceWriter.on('finish', () => resolve());
      sourceWriter.on('error', (err) => reject(err));
    });

    await browser.close();

    // Save to database
    await paperDB.add({
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

    spinner.succeed(chalk.green(`Successfully downloaded paper: ${title}`));
  } catch (error) {
    spinner.fail(chalk.red('Failed to download paper'));
    console.error(error);
  }
}

const downloadCommand: CommandFunction = (program: Command) => {
  program
    .command('download <url>')
    .description('Download a paper from arXiv')
    .option('-t, --tag <tag>', 'Tag for organizing papers', 'default')
    .action((url, options) => {
      download(url, { tag: options.tag });
    });
};

export default downloadCommand; 