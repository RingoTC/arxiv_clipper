import { Paper } from '../types';
/**
 * Extract arXiv ID from URL or ID string
 * @param input arXiv URL or ID
 * @returns arXiv ID
 */
export declare function extractArxivId(input: string): string;
/**
 * Get paper metadata from arXiv API
 * @param arxivId arXiv ID
 * @returns Paper metadata
 */
export declare function getPaperMetadata(arxivId: string): Promise<Paper>;
/**
 * Get BibTeX citation for a paper
 * @param arxivId arXiv ID
 * @returns BibTeX citation
 */
export declare function getBibTeX(arxivId: string): Promise<string>;
/**
 * Download paper PDF
 * @param arxivId arXiv ID
 * @param outputDir Output directory
 * @returns Path to downloaded PDF
 */
export declare function downloadPdf(arxivId: string, outputDir: string): Promise<string>;
/**
 * Download paper source files
 * @param arxivId arXiv ID
 * @param outputDir Output directory
 * @returns Path to downloaded source files
 */
export declare function downloadSource(arxivId: string, outputDir: string): Promise<string>;
/**
 * Create paper directory
 * @param paper Paper metadata
 * @param tag Tag for organizing papers
 * @returns Path to paper directory
 */
export declare function createPaperDirectory(paper: Paper, tag?: string): string;
/**
 * Save BibTeX to file
 * @param bibtex BibTeX content
 * @param outputDir Output directory
 * @returns Path to saved BibTeX file
 */
export declare function saveBibTeX(bibtex: string, outputDir: string): Promise<string>;
