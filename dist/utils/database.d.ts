import { Paper } from '../types';
/**
 * Get all papers from the database
 * @returns Array of paper objects
 */
export declare function getAllPapers(): Paper[];
/**
 * Save papers to the database
 * @param papers Array of paper objects
 */
export declare function savePapers(papers: Paper[]): void;
/**
 * Add a paper to the database
 * @param paper Paper object
 */
export declare function addPaper(paper: Paper): void;
/**
 * Find papers by search terms
 * @param searchTerms Array of search terms
 * @returns Array of matching paper objects
 */
export declare function findPapers(searchTerms?: string[]): Paper[];
/**
 * Find papers by tag
 * @param tag Tag to search for
 * @returns Array of matching paper objects
 */
export declare function findPapersByTag(tag?: string): Paper[];
/**
 * Delete papers by IDs
 * @param paperIds Array of paper IDs to delete
 */
export declare function deletePapers(paperIds?: string[]): void;
