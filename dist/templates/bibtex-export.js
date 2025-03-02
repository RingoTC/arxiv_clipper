// DOM Elements
const previewButton = document.getElementById('preview-button');
const copyButton = document.getElementById('copy-button');
const exportButton = document.getElementById('export-button');
const bibtexPreview = document.getElementById('bibtex-preview');

// Generate BibTeX for selected papers
function generateBibTeX() {
    const selectedPapers = state.papers.filter(paper => 
        state.selectedPapers.has(paper.id)
    );
    
    if (selectedPapers.length === 0) {
        return 'No papers selected for BibTeX export.';
    }
    
    // Generate BibTeX entries for papers that don't have them
    return selectedPapers.map(paper => {
        if (paper.bibtex) {
            return paper.bibtex;
        }
        
        // Generate a BibTeX entry if one doesn't exist
        const authors = Array.isArray(paper.authors) 
            ? paper.authors.join(' and ') 
            : paper.authors || 'Unknown';
        
        const year = paper.publishedDate 
            ? new Date(paper.publishedDate).getFullYear() 
            : new Date().getFullYear();
        
        const arxivId = paper.arxivId || paper.id;
        
        return `@article{${arxivId.replace('.', '')},
  title = {${paper.title || 'Untitled'}},
  author = {${authors}},
  journal = {arXiv preprint arXiv:${arxivId}},
  year = {${year}},
  url = {https://arxiv.org/abs/${arxivId}},
}`;
    }).join('\n\n');
}

// Preview BibTeX
function previewBibTeX() {
    const bibtex = generateBibTeX();
    bibtexPreview.textContent = bibtex;
    bibtexPreview.style.display = 'block';
    
    // Scroll to preview
    bibtexPreview.scrollIntoView({ behavior: 'smooth' });
}

// Copy BibTeX to clipboard
function copyBibTeX() {
    const bibtex = generateBibTeX();
    
    navigator.clipboard.writeText(bibtex)
        .then(() => {
            showAlert('BibTeX copied to clipboard!', 'success');
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
            showAlert('Failed to copy to clipboard. Please try again.', 'error');
        });
}

// Export BibTeX as file
function exportBibTeX() {
    const bibtex = generateBibTeX();
    const blob = new Blob([bibtex], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'arxiv-papers.bib';
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
    
    showAlert('BibTeX exported to file', 'success');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    previewButton.addEventListener('click', previewBibTeX);
    copyButton.addEventListener('click', copyBibTeX);
    exportButton.addEventListener('click', exportBibTeX);
}); 