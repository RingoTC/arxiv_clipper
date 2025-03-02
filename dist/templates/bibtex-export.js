// DOM Elements
let previewButton;
let copyButton;
let exportButton;
let bibtexPreview;

// Initialize DOM elements after the document is fully loaded
function initElements() {
    previewButton = document.getElementById('preview-button');
    copyButton = document.getElementById('copy-button');
    exportButton = document.getElementById('export-button');
    bibtexPreview = document.getElementById('bibtex-preview');
    
    // Add event listeners only after elements are found
    if (copyButton) copyButton.addEventListener('click', copyBibTeX);
    if (exportButton) exportButton.addEventListener('click', exportBibTeX);
    if (previewButton) previewButton.addEventListener('click', previewBibTeX);
}

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
    if (!bibtexPreview) return;
    
    const bibtex = generateBibTeX();
    bibtexPreview.textContent = bibtex;
    bibtexPreview.style.display = 'block';
    
    // Scroll to preview
    bibtexPreview.scrollIntoView({ behavior: 'smooth' });
}

// Copy BibTeX to clipboard
function copyBibTeX() {
    const bibtex = generateBibTeX();
    
    // Use a safer approach for clipboard operations
    try {
        // Create a temporary textarea element
        const textarea = document.createElement('textarea');
        textarea.value = bibtex;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        
        // Append to the document, select and copy
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        
        // Clean up
        document.body.removeChild(textarea);
        
        // Show success message
        showToast('Success', 'BibTeX copied to clipboard!', 'success');
    } catch (err) {
        console.error('Failed to copy: ', err);
        showToast('Error', 'Failed to copy to clipboard. Please try again.', 'danger');
    }
}

// Export BibTeX as file
function exportBibTeX() {
    const bibtex = generateBibTeX();
    const blob = new Blob([bibtex], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    try {
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
        
        showToast('Success', 'BibTeX exported to file', 'success');
    } catch (err) {
        console.error('Failed to export: ', err);
        showToast('Error', 'Failed to export BibTeX. Please try again.', 'danger');
    }
}

// Show toast notification
function showToast(title, message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;
    
    const toastId = 'toast-' + Date.now();
    
    const toastHTML = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <strong class="me-auto">${title}</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    const toastElement = document.getElementById(toastId);
    if (toastElement) {
        const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 3000 });
        toast.show();
        
        // Remove toast from DOM after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', initElements); 