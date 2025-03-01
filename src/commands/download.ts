import puppeteer from 'puppeteer';
import { join } from 'path';
import { homedir } from 'os';
import { mkdir } from 'fs/promises';
import { paperDB } from '../models/Paper.js';
import ora from 'ora';
import chalk from 'chalk';

interface DownloadOptions {
  tag: string;
}

export async function download(url: string, options: DownloadOptions) {
  const spinner = ora('Downloading paper...').start();
  
  try {
    const arxivId = url.split('/').pop();
    if (!arxivId) {
      throw new Error('Invalid arXiv URL');
    }

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Configure download behavior
    const downloadPath = join(homedir(), 'Development', 'arxiv', options.tag);
    await mkdir(downloadPath, { recursive: true });
    
    const client = await page.createCDPSession();
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: downloadPath
    });

    await page.goto(url, { waitUntil: 'networkidle0' });

    // Get paper title
    const titleElement = await page.waitForSelector('h1.title');
    const title = await titleElement?.evaluate(el => (el as HTMLElement).textContent?.replace('Title:', '').trim()) || '';

    // Create paper directory
    const paperDir = join(downloadPath, title);
    await mkdir(paperDir, { recursive: true });

    // Download PDF
    const pdfButton = await page.waitForSelector('a[href$=".pdf"]');
    await pdfButton?.click();
    
    // Wait for PDF download to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Download source
    const sourceButton = await page.waitForSelector('a[href$=".tar.gz"], a[href$=".gz"]');
    await sourceButton?.click();
    
    // Wait for source download to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    await browser.close();

    // Save to database
    await paperDB.addPaper({
      title,
      arxivId,
      tag: options.tag,
      pdfPath: join(paperDir, `${arxivId}.pdf`),
      sourcePath: join(paperDir, `${arxivId}.tar.gz`)
    });

    spinner.succeed(chalk.green(`Successfully downloaded paper: ${title}`));
  } catch (error) {
    spinner.fail(chalk.red('Failed to download paper'));
    console.error(error);
  }
} 