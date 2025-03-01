import fs from 'fs-extra';
import { DATABASE_PATH } from './config';
import { Paper } from '../types';

/**
 * Get all papers from the database
 * @returns Array of paper objects
 */
export function getAllPapers(): Paper[] {
  try {
    const data = fs.readJsonSync(DATABASE_PATH);
    return data.papers || [];
  } catch (error) {
    console.error(`Error reading database: ${(error as Error).message}`);
    return [];
  }
}

/**
 * Save papers to the database
 * @param papers Array of paper objects
 */
export function savePapers(papers: Paper[]): void {
  fs.writeJsonSync(DATABASE_PATH, { papers }, { spaces: 2 });
}

/**
 * Add a paper to the database
 * @param paper Paper object
 */
export function addPaper(paper: Paper): void {
  const papers = getAllPapers();
  papers.push(paper);
  savePapers(papers);
}

/**
 * Find papers by search terms
 * @param searchTerms Array of search terms
 * @returns Array of matching paper objects
 */
export function findPapers(searchTerms?: string[]): Paper[] {
  const papers = getAllPapers();
  
  if (!searchTerms || searchTerms.length === 0) {
    return papers;
  }
  
  return papers.filter(paper => {
    // Ensure authors is always an array for searching
    const authors = Array.isArray(paper.authors) 
      ? paper.authors.join(' ') 
      : paper.authors || '';
    
    const searchString = `${paper.title || ''} ${authors} ${paper.abstract || ''}`.toLowerCase();
    return searchTerms.every(term => searchString.includes(term.toLowerCase()));
  });
}

/**
 * Find papers by tag
 * @param tag Tag to search for
 * @returns Array of matching paper objects
 */
export function findPapersByTag(tag?: string): Paper[] {
  const papers = getAllPapers();
  
  if (!tag) {
    return papers;
  }
  
  return papers.filter(paper => paper.tag === tag);
}

/**
 * Delete papers by IDs
 * @param paperIds Array of paper IDs to delete
 */
export function deletePapers(paperIds?: string[]): void {
  if (!paperIds || paperIds.length === 0) {
    return;
  }
  
  const papers = getAllPapers();
  const filteredPapers = papers.filter(paper => !paperIds.includes(paper.id));
  savePapers(filteredPapers);
} 