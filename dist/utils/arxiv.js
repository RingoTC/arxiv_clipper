"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractArxivId = extractArxivId;
exports.getPaperMetadata = getPaperMetadata;
exports.getBibTeX = getBibTeX;
exports.downloadPdf = downloadPdf;
exports.downloadSource = downloadSource;
exports.createPaperDirectory = createPaperDirectory;
exports.saveBibTeX = saveBibTeX;
const axios_1 = __importDefault(require("axios"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const config_1 = require("./config");
/**
 * Extract arXiv ID from URL or ID string
 * @param input arXiv URL or ID
 * @returns arXiv ID
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
 * @param arxivId arXiv ID
 * @returns Paper metadata
 */
async function getPaperMetadata(arxivId) {
    const apiUrl = `http://export.arxiv.org/api/query?id_list=${arxivId}`;
    try {
        const response = await axios_1.default.get(apiUrl);
        const xml = response.data;
        // Extract title - handle multiple title tags by finding the one after "entry"
        let title = '';
        const entryTitleMatch = xml.match(/<entry>[\s\S]*?<title>(.*?)<\/title>/);
        if (entryTitleMatch) {
            title = entryTitleMatch[1].replace('Title:', '').trim();
        }
        else {
            const titleMatch = xml.match(/<title>(.*?)<\/title>/);
            title = titleMatch ? titleMatch[1].replace('Title:', '').trim() : 'Untitled';
        }
        // Improved author extraction
        const authorMatches = xml.match(/<author>([\s\S]*?)<\/author>/g);
        const authors = [];
        if (authorMatches) {
            authorMatches.forEach((authorXml) => {
                // Try to extract name from <n> tag first (newer format)
                const nameMatch = authorXml.match(/<n>(.*?)<\/name>/);
                if (nameMatch && nameMatch[1]) {
                    authors.push(nameMatch[1].trim());
                }
                else {
                    // Try to extract from <n> tag (older format)
                    const nMatch = authorXml.match(/<n>(.*?)<\/n>/);
                    if (nMatch && nMatch[1]) {
                        authors.push(nMatch[1].trim());
                    }
                }
            });
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
        const categories = categoryMatch ? [categoryMatch[1]] : [];
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
    }
    catch (error) {
        throw new Error(`Failed to fetch paper metadata: ${error.message}`);
    }
}
/**
 * Get BibTeX citation for a paper
 * @param arxivId arXiv ID
 * @returns BibTeX citation
 */
async function getBibTeX(arxivId) {
    const bibtexUrl = `https://arxiv.org/bibtex/${arxivId}`;
    try {
        const response = await axios_1.default.get(bibtexUrl);
        return response.data;
    }
    catch (error) {
        throw new Error(`Failed to fetch BibTeX: ${error.message}`);
    }
}
/**
 * Download paper PDF
 * @param arxivId arXiv ID
 * @param outputDir Output directory
 * @returns Path to downloaded PDF
 */
async function downloadPdf(arxivId, outputDir) {
    const pdfUrl = `https://arxiv.org/pdf/${arxivId}.pdf`;
    const outputPath = path_1.default.join(outputDir, 'paper.pdf');
    try {
        const response = await (0, axios_1.default)({
            method: 'get',
            url: pdfUrl,
            responseType: 'stream'
        });
        const writer = fs_extra_1.default.createWriteStream(outputPath);
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(outputPath));
            writer.on('error', reject);
        });
    }
    catch (error) {
        throw new Error(`Failed to download PDF: ${error.message}`);
    }
}
/**
 * Download paper source files
 * @param arxivId arXiv ID
 * @param outputDir Output directory
 * @returns Path to downloaded source files
 */
async function downloadSource(arxivId, outputDir) {
    const sourceUrl = `https://arxiv.org/e-print/${arxivId}`;
    const outputPath = path_1.default.join(outputDir, 'source.tar.gz');
    try {
        const response = await (0, axios_1.default)({
            method: 'get',
            url: sourceUrl,
            responseType: 'stream'
        });
        const writer = fs_extra_1.default.createWriteStream(outputPath);
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(outputPath));
            writer.on('error', reject);
        });
    }
    catch (error) {
        throw new Error(`Failed to download source files: ${error.message}`);
    }
}
/**
 * Create paper directory
 * @param paper Paper metadata
 * @param tag Tag for organizing papers
 * @returns Path to paper directory
 */
function createPaperDirectory(paper, tag = 'default') {
    // Sanitize title for use as directory name
    const sanitizedTitle = (paper.title || 'Untitled')
        .replace(/[/\\?%*:|"<>]/g, '-')
        .replace(/\s+/g, ' ')
        .trim();
    // Ensure tag directory exists
    const tagDir = path_1.default.join(config_1.PAPERS_DIR, tag);
    fs_extra_1.default.ensureDirSync(tagDir);
    const paperDir = path_1.default.join(tagDir, sanitizedTitle);
    fs_extra_1.default.ensureDirSync(paperDir);
    return paperDir;
}
/**
 * Save BibTeX to file
 * @param bibtex BibTeX content
 * @param outputDir Output directory
 * @returns Path to saved BibTeX file
 */
async function saveBibTeX(bibtex, outputDir) {
    const outputPath = path_1.default.join(outputDir, 'citation.bib');
    try {
        await fs_extra_1.default.writeFile(outputPath, bibtex);
        return outputPath;
    }
    catch (error) {
        throw new Error(`Failed to save BibTeX: ${error.message}`);
    }
}
