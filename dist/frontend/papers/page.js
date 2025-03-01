"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = PapersPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const card_1 = require("@/components/ui/card");
const badge_1 = require("@/components/ui/badge");
const checkbox_1 = require("@/components/ui/checkbox");
const select_1 = require("@/components/ui/select");
const date_fns_1 = require("date-fns");
exports.metadata = {
    title: 'arXiv Downloader - Papers',
    description: 'Browse and search your arXiv papers',
};
function PapersPage() {
    const [papers, setPapers] = (0, react_1.useState)([]);
    const [filteredPapers, setFilteredPapers] = (0, react_1.useState)([]);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [selectedTag, setSelectedTag] = (0, react_1.useState)('');
    const [tags, setTags] = (0, react_1.useState)([]);
    const [selectedPapers, setSelectedPapers] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    // Fetch papers
    (0, react_1.useEffect)(() => {
        const fetchPapers = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/papers');
                const data = await response.json();
                setPapers(data.papers || []);
                setFilteredPapers(data.papers || []);
                // Extract unique tags
                const uniqueTags = Array.from(new Set(data.papers.map((paper) => paper.tag).filter(Boolean)));
                setTags(uniqueTags);
            }
            catch (error) {
                console.error('Error fetching papers:', error);
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchPapers();
    }, []);
    // Filter papers based on search query and selected tag
    (0, react_1.useEffect)(() => {
        let filtered = [...papers];
        // Filter by tag
        if (selectedTag) {
            filtered = filtered.filter(paper => paper.tag === selectedTag);
        }
        // Filter by search query
        if (searchQuery) {
            const terms = searchQuery.toLowerCase().split(' ');
            filtered = filtered.filter(paper => {
                const searchString = `${paper.title || ''} ${Array.isArray(paper.authors) ? paper.authors.join(' ') : ''} ${paper.abstract || ''}`.toLowerCase();
                return terms.every(term => searchString.includes(term));
            });
        }
        setFilteredPapers(filtered);
    }, [papers, searchQuery, selectedTag]);
    // Handle paper selection
    const togglePaperSelection = (paperId) => {
        setSelectedPapers(prev => prev.includes(paperId)
            ? prev.filter(id => id !== paperId)
            : [...prev, paperId]);
    };
    // Export selected papers as BibTeX
    const exportBibTeX = async () => {
        if (selectedPapers.length === 0)
            return;
        try {
            const response = await fetch('/api/papers/bibtex', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ paperIds: selectedPapers }),
            });
            const data = await response.json();
            if (data.bibtex) {
                // Create a blob and download it
                const blob = new Blob([data.bibtex], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'references.bib';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        }
        catch (error) {
            console.error('Error exporting BibTeX:', error);
        }
    };
    return (<div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <link_1.default href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold">arXiv Downloader</span>
            </link_1.default>
          </div>
          <nav className="flex flex-1 items-center justify-end space-x-2">
            <link_1.default href="/papers">
              <button_1.Button variant="ghost">Papers</button_1.Button>
            </link_1.default>
            <link_1.default href="/bibtex">
              <button_1.Button variant="ghost">BibTeX</button_1.Button>
            </link_1.default>
          </nav>
        </div>
      </header>
      <main className="flex-1 container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Papers</h1>
          <button_1.Button onClick={exportBibTeX} disabled={selectedPapers.length === 0}>
            Export Selected as BibTeX
          </button_1.Button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input_1.Input placeholder="Search papers by title, author, or content..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full"/>
          </div>
          <div className="w-full md:w-64">
            <select_1.Select value={selectedTag} onValueChange={setSelectedTag}>
              <select_1.SelectTrigger>
                <select_1.SelectValue placeholder="Filter by tag"/>
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                <select_1.SelectItem value="">All Tags</select_1.SelectItem>
                {tags.map(tag => (<select_1.SelectItem key={tag} value={tag}>{tag}</select_1.SelectItem>))}
              </select_1.SelectContent>
            </select_1.Select>
          </div>
        </div>
        
        {isLoading ? (<div className="flex justify-center items-center h-64">
            <p>Loading papers...</p>
          </div>) : filteredPapers.length === 0 ? (<div className="flex justify-center items-center h-64">
            <p>No papers found. Try adjusting your search or filter.</p>
          </div>) : (<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPapers.map(paper => (<card_1.Card key={paper.id} className="flex flex-col">
                <card_1.CardHeader>
                  <div className="flex items-start gap-2">
                    <checkbox_1.Checkbox id={`select-${paper.id}`} checked={selectedPapers.includes(paper.id)} onCheckedChange={() => togglePaperSelection(paper.id)} className="mt-1"/>
                    <div>
                      <card_1.CardTitle className="text-lg">{paper.title}</card_1.CardTitle>
                      <card_1.CardDescription>
                        {paper.authors.slice(0, 3).join(', ')}
                        {paper.authors.length > 3 && ', et al.'}
                      </card_1.CardDescription>
                    </div>
                  </div>
                </card_1.CardHeader>
                <card_1.CardContent className="flex-1">
                  <p className="text-sm text-gray-500 line-clamp-3 mb-2">
                    {paper.abstract}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {paper.categories.map(category => (<badge_1.Badge key={category} variant="secondary">{category}</badge_1.Badge>))}
                    {paper.tag && (<badge_1.Badge variant="outline">{paper.tag}</badge_1.Badge>)}
                  </div>
                </card_1.CardContent>
                <card_1.CardFooter className="flex justify-between border-t pt-4">
                  <div className="text-xs text-gray-500">
                    {paper.publishedDate && (0, date_fns_1.format)(new Date(paper.publishedDate), 'MMM d, yyyy')}
                  </div>
                  <div className="flex gap-2">
                    {paper.pdfPath && (<button_1.Button variant="outline" size="sm" asChild>
                        <a href={`file://${paper.pdfPath}`} target="_blank" rel="noopener noreferrer">
                          PDF
                        </a>
                      </button_1.Button>)}
                    <button_1.Button variant="outline" size="sm" asChild>
                      <a href={paper.url} target="_blank" rel="noopener noreferrer">
                        arXiv
                      </a>
                    </button_1.Button>
                  </div>
                </card_1.CardFooter>
              </card_1.Card>))}
          </div>)}
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} arXiv Downloader. All rights reserved.
          </p>
        </div>
      </footer>
    </div>);
}
