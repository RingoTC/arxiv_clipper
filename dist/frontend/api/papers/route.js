"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Path to the papers database
const PAPERS_JSON_PATH = path_1.default.join(process.cwd(), 'src', 'app', 'api', 'papers.json');
// GET /api/papers
async function GET(request) {
    try {
        // Get search params
        const { searchParams } = new URL(request.url);
        const tag = searchParams.get('tag');
        const search = searchParams.get('search');
        // Read the papers database
        const data = JSON.parse(fs_1.default.readFileSync(PAPERS_JSON_PATH, 'utf-8'));
        let papers = data.papers || [];
        // Filter by tag if provided
        if (tag) {
            papers = papers.filter(paper => paper.tag === tag);
        }
        // Filter by search terms if provided
        if (search) {
            const searchTerms = search.toLowerCase().split(' ');
            papers = papers.filter(paper => {
                const searchString = `${paper.title || ''} ${Array.isArray(paper.authors) ? paper.authors.join(' ') : ''} ${paper.abstract || ''}`.toLowerCase();
                return searchTerms.every(term => searchString.includes(term));
            });
        }
        return server_1.NextResponse.json({ papers });
    }
    catch (error) {
        console.error('Error fetching papers:', error);
        return server_1.NextResponse.json({ error: 'Failed to fetch papers' }, { status: 500 });
    }
}
// POST /api/papers/bibtex
async function POST(request) {
    try {
        const { paperIds } = await request.json();
        if (!paperIds || !Array.isArray(paperIds)) {
            return server_1.NextResponse.json({ error: 'Invalid request. Expected paperIds array.' }, { status: 400 });
        }
        // Read the papers database
        const data = JSON.parse(fs_1.default.readFileSync(PAPERS_JSON_PATH, 'utf-8'));
        const papers = data.papers || [];
        // Filter papers by IDs
        const selectedPapers = papers.filter(paper => paperIds.includes(paper.id));
        // Extract BibTeX entries
        const bibtexEntries = selectedPapers
            .filter(paper => paper.bibtex)
            .map(paper => paper.bibtex)
            .join('\n\n');
        return server_1.NextResponse.json({ bibtex: bibtexEntries });
    }
    catch (error) {
        console.error('Error generating BibTeX:', error);
        return server_1.NextResponse.json({ error: 'Failed to generate BibTeX' }, { status: 500 });
    }
}
