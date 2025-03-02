import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { PAPERS_DIR } from './config';
import { Paper } from '../types';

/**
 * Extract arXiv ID from URL or ID string
 * @param input arXiv URL or ID
 * @returns arXiv ID
 */
export function extractArxivId(input: string): string {
  // If it's already an ID (e.g., 2007.12324)
  if (/^\d+\.\d+$/.test(input)) {
    return input;
  }
  
  // If it's a URL (e.g., https://arxiv.org/abs/2007.12324)
  const urlMatch = input.match(/arxiv\.org\/(?:abs|pdf)\/(\d+\.\d+)/);
  if (urlMatch) {
    return urlMatch[1];
  }
  
  // If it's a URL with 'v' version (e.g., https://arxiv.org/abs/2007.12324v1)
  const versionMatch = input.match(/arxiv\.org\/(?:abs|pdf)\/(\d+\.\d+)v\d+/);
  if (versionMatch) {
    return versionMatch[1];
  }
  
  throw new Error('Invalid arXiv URL or ID');
}

/**
 * Get paper metadata from arXiv API
 * @param arxivId arXiv ID
 * @returns Paper metadata
 */
export async function getPaperMetadata(arxivId: string): Promise<Paper> {
  const apiUrl = `http://export.arxiv.org/api/query?id_list=${arxivId}`;
  
  try {
    const response = await axios.get(apiUrl);
    const xml = response.data;
    
    // Extract title - improved regex to handle different formats
    let title = '';
    const entryTitleMatch = xml.match(/<entry>[\s\S]*?<title>([\s\S]*?)<\/title>/);
    if (entryTitleMatch && entryTitleMatch[1]) {
      title = entryTitleMatch[1].replace(/Title:\s*/i, '').trim();
    } else {
      const titleMatch = xml.match(/<title>([\s\S]*?)<\/title>/);
      title = titleMatch && titleMatch[1] ? titleMatch[1].replace(/Title:\s*/i, '').trim() : 'Untitled';
    }
    
    // Improved author extraction
    const authorMatches = xml.match(/<author>([\s\S]*?)<\/author>/g);
    const authors: string[] = [];
    
    if (authorMatches) {
      authorMatches.forEach((authorXml: string) => {
        // Try to extract name from <name> tag (standard format)
        const nameMatch = authorXml.match(/<name>(.*?)<\/name>/);
        if (nameMatch && nameMatch[1]) {
          authors.push(nameMatch[1].trim());
        } else {
          // Try to extract from <name> tag (older format)
          const nMatch = authorXml.match(/<name>(.*?)<\/name>/);
          if (nMatch && nMatch[1]) {
            authors.push(nMatch[1].trim());
          }
        }
      });
    }
    
    // If no authors were found, try alternative extraction method
    if (authors.length === 0) {
      const nameMatches = xml.match(/<name>(.*?)<\/name>/g);
      if (nameMatches) {
        nameMatches.forEach((nameXml: string) => {
          const nameContent = nameXml.match(/<name>(.*?)<\/name>/);
          if (nameContent && nameContent[1]) {
            authors.push(nameContent[1].trim());
          }
        });
      }
    }
    
    // Extract abstract
    const abstractMatch = xml.match(/<summary>([\s\S]*?)<\/summary>/);
    const abstract = abstractMatch ? abstractMatch[1].trim() : '';
    
    // Extract published date
    const publishedMatch = xml.match(/<published>(.*?)<\/published>/);
    const publishedDate = publishedMatch ? publishedMatch[1].trim() : '';
    
    // Extract updated date
    const updatedMatch = xml.match(/<updated>(.*?)<\/updated>/);
    const updatedDate = updatedMatch ? updatedMatch[1].trim() : '';
    
    // Extract categories
    const categoryMatch = xml.match(/<category term="(.*?)"/);
    const categories: string[] = categoryMatch ? [categoryMatch[1]] : [];
    
    return {
      id: arxivId,
      title,
      authors,
      abstract,
      categories,
      publishedDate,
      updatedDate,
      url: `https://arxiv.org/abs/${arxivId}`
    };
  } catch (error) {
    throw new Error(`Failed to fetch paper metadata: ${(error as Error).message}`);
  }
}

/**
 * Get BibTeX citation for a paper
 * @param arxivId arXiv ID
 * @returns BibTeX citation
 */
export async function getBibTeX(arxivId: string): Promise<string> {
  const bibtexUrl = `https://arxiv.org/bibtex/${arxivId}`;
  
  try {
    const response = await axios.get(bibtexUrl);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch BibTeX: ${(error as Error).message}`);
  }
}

/**
 * Download paper PDF
 * @param arxivId arXiv ID
 * @param outputDir Output directory
 * @returns Path to downloaded PDF
 */
export async function downloadPdf(arxivId: string, outputDir: string): Promise<string> {
  const pdfUrl = `https://arxiv.org/pdf/${arxivId}.pdf`;
  const outputPath = path.join(outputDir, 'paper.pdf');
  
  try {
    const response = await axios({
      method: 'get',
      url: pdfUrl,
      responseType: 'stream'
    });
    
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);
    
    return new Promise<string>((resolve, reject) => {
      writer.on('finish', () => resolve(outputPath));
      writer.on('error', reject);
    });
  } catch (error) {
    throw new Error(`Failed to download PDF: ${(error as Error).message}`);
  }
}

/**
 * Download paper source files
 * @param arxivId arXiv ID
 * @param outputDir Output directory
 * @returns Path to downloaded source files
 */
export async function downloadSource(arxivId: string, outputDir: string): Promise<string> {
  const sourceUrl = `https://arxiv.org/e-print/${arxivId}`;
  const outputPath = path.join(outputDir, 'source.tar.gz');
  
  try {
    const response = await axios({
      method: 'get',
      url: sourceUrl,
      responseType: 'stream'
    });
    
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);
    
    return new Promise<string>((resolve, reject) => {
      writer.on('finish', () => resolve(outputPath));
      writer.on('error', reject);
    });
  } catch (error) {
    throw new Error(`Failed to download source files: ${(error as Error).message}`);
  }
}

/**
 * Create paper directory
 * @param paper Paper metadata
 * @param tag Tag for organizing papers
 * @returns Path to paper directory
 */
export function createPaperDirectory(paper: Paper, tag = 'default'): string {
  // Sanitize title for use as directory name
  const sanitizedTitle = (paper.title || 'Untitled')
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Ensure tag directory exists
  const tagDir = path.join(PAPERS_DIR, tag);
  fs.ensureDirSync(tagDir);
  
  const paperDir = path.join(tagDir, sanitizedTitle);
  fs.ensureDirSync(paperDir);
  
  return paperDir;
}

/**
 * Save BibTeX to file
 * @param bibtex BibTeX content
 * @param outputDir Output directory
 * @returns Path to saved BibTeX file
 */
export async function saveBibTeX(bibtex: string, outputDir: string): Promise<string> {
  const outputPath = path.join(outputDir, 'citation.bib');
  
  try {
    await fs.writeFile(outputPath, bibtex);
    return outputPath;
  } catch (error) {
    throw new Error(`Failed to save BibTeX: ${(error as Error).message}`);
  }
} 