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
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface DownloadOptions {
  tag: string;
  github?: string;
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

    // Handle GitHub repository download if provided
    let githubUrl: string | undefined;
    let localGithubPath: string | undefined;
    
    if (options.github) {
      githubUrl = options.github;
      spinner.text = 'Downloading GitHub repository...';
      
      // Create GitHub directory
      const githubDir = join(paperDir, 'github');
      await mkdir(githubDir, { recursive: true });
      
      // Clone the repository
      try {
        // Properly quote the path to handle spaces
        await execAsync(`git clone "${githubUrl}" "${githubDir}"`);
        localGithubPath = githubDir;
        spinner.succeed(chalk.green(`Successfully cloned GitHub repository: ${githubUrl}`));
        spinner.start('Finalizing paper download...');
      } catch (error) {
        console.error(chalk.yellow(`Warning: Failed to clone GitHub repository: ${githubUrl}`));
        console.error(error);
      }
    }

    await browser.close();

    // Save to database
    await paperDB.add({
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
    .option('--github <url>', 'GitHub repository URL to download along with the paper')
    .action((url, options) => {
      download(url, { tag: options.tag, github: options.github });
    });
};

export default downloadCommand; 