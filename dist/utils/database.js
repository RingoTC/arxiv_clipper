"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPapers = getAllPapers;
exports.savePapers = savePapers;
exports.addPaper = addPaper;
exports.findPapers = findPapers;
exports.findPapersByTag = findPapersByTag;
exports.deletePapers = deletePapers;
const fs_extra_1 = __importDefault(require("fs-extra"));
const config_1 = require("./config");
/**
 * Get all papers from the database
 * @returns Array of paper objects
 */
function getAllPapers() {
    try {
        const data = fs_extra_1.default.readJsonSync(config_1.DATABASE_PATH);
        return data.papers || [];
    }
    catch (error) {
        console.error(`Error reading database: ${error.message}`);
        return [];
    }
}
/**
 * Save papers to the database
 * @param papers Array of paper objects
 */
function savePapers(papers) {
    fs_extra_1.default.writeJsonSync(config_1.DATABASE_PATH, { papers }, { spaces: 2 });
}
/**
 * Add a paper to the database
 * @param paper Paper object
 */
function addPaper(paper) {
    const papers = getAllPapers();
    papers.push(paper);
    savePapers(papers);
}
/**
 * Find papers by search terms
 * @param searchTerms Array of search terms
 * @returns Array of matching paper objects
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
 * @param tag Tag to search for
 * @returns Array of matching paper objects
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
 * @param paperIds Array of paper IDs to delete
 */
function deletePapers(paperIds) {
    if (!paperIds || paperIds.length === 0) {
        return;
    }
    const papers = getAllPapers();
    const filteredPapers = papers.filter(paper => !paperIds.includes(paper.id));
    savePapers(filteredPapers);
}
