"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = BibTeXPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const button_1 = require("@/components/ui/button");
const checkbox_1 = require("@/components/ui/checkbox");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const select_1 = require("@/components/ui/select");
const textarea_1 = require("@/components/ui/textarea");
const card_1 = require("@/components/ui/card");
const badge_1 = require("@/components/ui/badge");
const date_fns_1 = require("date-fns");
exports.metadata = {
    title: 'arXiv Downloader - BibTeX Export',
    description: 'Export BibTeX citations for your arXiv papers',
};
function BibTeXPage() {
    const [papers, setPapers] = (0, react_1.useState)([]);
    const [filteredPapers, setFilteredPapers] = (0, react_1.useState)([]);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [selectedTag, setSelectedTag] = (0, react_1.useState)('');
    const [tags, setTags] = (0, react_1.useState)([]);
    const [selectedPapers, setSelectedPapers] = (0, react_1.useState)([]);
    const [bibtexOutput, setBibtexOutput] = (0, react_1.useState)('');
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
    // Toggle paper selection
    const togglePaperSelection = (paperId) => {
        setSelectedPapers(prev => prev.includes(paperId)
            ? prev.filter(id => id !== paperId)
            : [...prev, paperId]);
    };
    // Select all papers
    const selectAllPapers = () => {
        if (selectedPapers.length === filteredPapers.length) {
            setSelectedPapers([]);
        }
        else {
            setSelectedPapers(filteredPapers.map(paper => paper.id));
        }
    };
    // Generate BibTeX
    const generateBibTeX = async () => {
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
                setBibtexOutput(data.bibtex);
            }
        }
        catch (error) {
            console.error('Error generating BibTeX:', error);
        }
    };
    // Download BibTeX
    const downloadBibTeX = () => {
        if (!bibtexOutput)
            return;
        const blob = new Blob([bibtexOutput], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'references.bib';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    // Copy BibTeX to clipboard
    const copyBibTeX = () => {
        if (!bibtexOutput)
            return;
        navigator.clipboard.writeText(bibtexOutput)
            .then(() => {
            alert('BibTeX copied to clipboard!');
        })
            .catch(err => {
            console.error('Failed to copy: ', err);
        });
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
        <h1 className="text-3xl font-bold mb-6">BibTeX Export</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
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
            
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <checkbox_1.Checkbox id="select-all" checked={selectedPapers.length > 0 && selectedPapers.length === filteredPapers.length} onCheckedChange={selectAllPapers}/>
                <label_1.Label htmlFor="select-all">Select All</label_1.Label>
              </div>
              <button_1.Button onClick={generateBibTeX} disabled={selectedPapers.length === 0}>
                Generate BibTeX
              </button_1.Button>
            </div>
            
            {isLoading ? (<div className="flex justify-center items-center h-64">
                <p>Loading papers...</p>
              </div>) : filteredPapers.length === 0 ? (<div className="flex justify-center items-center h-64">
                <p>No papers found. Try adjusting your search or filter.</p>
              </div>) : (<div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {filteredPapers.map(paper => (<card_1.Card key={paper.id} className="flex flex-col">
                    <card_1.CardHeader className="pb-2">
                      <div className="flex items-start gap-2">
                        <checkbox_1.Checkbox id={`select-${paper.id}`} checked={selectedPapers.includes(paper.id)} onCheckedChange={() => togglePaperSelection(paper.id)} className="mt-1"/>
                        <div>
                          <card_1.CardTitle className="text-base">{paper.title}</card_1.CardTitle>
                          <card_1.CardDescription className="text-sm">
                            {paper.authors.slice(0, 3).join(', ')}
                            {paper.authors.length > 3 && ', et al.'}
                          </card_1.CardDescription>
                        </div>
                      </div>
                    </card_1.CardHeader>
                    <card_1.CardFooter className="pt-2 flex justify-between">
                      <div className="text-xs text-gray-500">
                        {paper.publishedDate && (0, date_fns_1.format)(new Date(paper.publishedDate), 'MMM d, yyyy')}
                      </div>
                      {paper.tag && (<badge_1.Badge variant="outline">{paper.tag}</badge_1.Badge>)}
                    </card_1.CardFooter>
                  </card_1.Card>))}
              </div>)}
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">BibTeX Output</h2>
              <div className="flex gap-2">
                <button_1.Button variant="outline" onClick={copyBibTeX} disabled={!bibtexOutput}>
                  Copy
                </button_1.Button>
                <button_1.Button onClick={downloadBibTeX} disabled={!bibtexOutput}>
                  Download
                </button_1.Button>
              </div>
            </div>
            <textarea_1.Textarea className="font-mono h-[600px]" value={bibtexOutput} readOnly placeholder="Select papers and click 'Generate BibTeX' to see the output here."/>
          </div>
        </div>
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
