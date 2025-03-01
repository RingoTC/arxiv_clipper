const fs = require('fs-extra');
const { DATABASE_PATH } = require('./config');

/**
 * Get all papers from the database
 * @returns {Array} Array of paper objects
 */
function getAllPapers() {
  try {
    const data = fs.readJsonSync(DATABASE_PATH);
    return data.papers || [];
  } catch (error) {
    console.error(`Error reading database: ${error.message}`);
    return [];
  }
}

/**
 * Save papers to the database
 * @param {Array} papers Array of paper objects
 */
function savePapers(papers) {
  fs.writeJsonSync(DATABASE_PATH, { papers }, { spaces: 2 });
}

/**
 * Add a paper to the database
 * @param {Object} paper Paper object
 */
function addPaper(paper) {
  const papers = getAllPapers();
  papers.push(paper);
  savePapers(papers);
}

/**
 * Find papers by search terms
 * @param {Array} searchTerms Array of search terms
 * @returns {Array} Array of matching paper objects
 */
function findPapers(searchTerms) {
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
 * @param {String} tag Tag to search for
 * @returns {Array} Array of matching paper objects
 */
function findPapersByTag(tag) {
  const papers = getAllPapers();
  
  if (!tag) {
    return papers;
  }
  
  return papers.filter(paper => paper.tag === tag);
}

/**
 * Delete papers by IDs
 * @param {Array} paperIds Array of paper IDs to delete
 */
function deletePapers(paperIds) {
  if (!paperIds || paperIds.length === 0) {
    return;
  }
  
  const papers = getAllPapers();
  const filteredPapers = papers.filter(paper => !paperIds.includes(paper.id));
  savePapers(filteredPapers);
}

module.exports = {
  getAllPapers,
  addPaper,
  findPapers,
  findPapersByTag,
  deletePapers
}; 