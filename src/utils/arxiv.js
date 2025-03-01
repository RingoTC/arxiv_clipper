const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { PAPERS_DIR } = require('./config');
const mkdirp = require('mkdirp');

/**
 * Extract arXiv ID from URL or ID string
 * @param {String} input arXiv URL or ID
 * @returns {String} arXiv ID
 */
function extractArxivId(input) {
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
 * @param {String} arxivId arXiv ID
 * @returns {Object} Paper metadata
 */
async function getPaperMetadata(arxivId) {
  const apiUrl = `http://export.arxiv.org/api/query?id_list=${arxivId}`;
  
  try {
    const response = await axios.get(apiUrl);
    const xml = response.data;
    
    // Extract title - handle multiple title tags by finding the one after "entry"
    let title = '';
    const entryTitleMatch = xml.match(/<entry>[\s\S]*?<title>(.*?)<\/title>/);
    if (entryTitleMatch) {
      title = entryTitleMatch[1].replace('Title:', '').trim();
    } else {
      const titleMatch = xml.match(/<title>(.*?)<\/title>/);
      title = titleMatch ? titleMatch[1].replace('Title:', '').trim() : 'Untitled';
    }
    
    // Extract authors
    const authorMatches = xml.match(/<author>([\s\S]*?)<\/author>/g);
    const authors = [];
    
    if (authorMatches) {
      authorMatches.forEach(authorXml => {
        const nameMatch = authorXml.match(/<name>(.*?)<\/name>/);
        if (nameMatch && nameMatch[1]) {
          authors.push(nameMatch[1].trim());
        }
      });
    }
    
    // Extract abstract
    const abstractMatch = xml.match(/<summary>([\s\S]*?)<\/summary>/);
    const abstract = abstractMatch ? abstractMatch[1].trim() : '';
    
    // Extract published date
    const publishedMatch = xml.match(/<published>(.*?)<\/published>/);
    const published = publishedMatch ? publishedMatch[1].trim() : '';
    
    return {
      id: arxivId,
      title,
      authors,
      abstract,
      published,
      url: `https://arxiv.org/abs/${arxivId}`
    };
  } catch (error) {
    throw new Error(`Failed to fetch paper metadata: ${error.message}`);
  }
}

/**
 * Download paper PDF
 * @param {String} arxivId arXiv ID
 * @param {String} outputDir Output directory
 * @returns {String} Path to downloaded PDF
 */
async function downloadPdf(arxivId, outputDir) {
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
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(outputPath));
      writer.on('error', reject);
    });
  } catch (error) {
    throw new Error(`Failed to download PDF: ${error.message}`);
  }
}

/**
 * Download paper source files
 * @param {String} arxivId arXiv ID
 * @param {String} outputDir Output directory
 * @returns {String} Path to downloaded source files
 */
async function downloadSource(arxivId, outputDir) {
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
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(outputPath));
      writer.on('error', reject);
    });
  } catch (error) {
    throw new Error(`Failed to download source files: ${error.message}`);
  }
}

/**
 * Create paper directory
 * @param {Object} paper Paper metadata
 * @param {String} tag Tag for organizing papers
 * @returns {String} Path to paper directory
 */
function createPaperDirectory(paper, tag = 'default') {
  // Sanitize title for use as directory name
  const sanitizedTitle = (paper.title || 'Untitled')
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Ensure tag directory exists
  const tagDir = path.join(PAPERS_DIR, tag);
  mkdirp.sync(tagDir);
  
  const paperDir = path.join(tagDir, sanitizedTitle);
  mkdirp.sync(paperDir);
  
  return paperDir;
}

module.exports = {
  extractArxivId,
  getPaperMetadata,
  downloadPdf,
  downloadSource,
  createPaperDirectory
}; 