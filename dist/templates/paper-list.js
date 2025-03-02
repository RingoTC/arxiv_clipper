// DOM Elements
const papersContainer = document.getElementById('papers-container');
const searchInput = document.getElementById('search-input');
const tagFilter = document.getElementById('tag-filter');
const selectAllCheckbox = document.getElementById('select-all');
const deleteSelectedButton = document.getElementById('delete-selected');
// Add BibTeX button references
const previewBibtexButton = document.getElementById('preview-button');
const copyBibtexButton = document.getElementById('copy-button');
const exportBibtexButton = document.getElementById('export-button');

// Paper list styles
const paperListStyles = document.createElement('style');
paperListStyles.textContent = `
    .papers-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 20px;
        margin-top: 20px;
    }
    
    .paper-card {
        background-color: var(--card-color);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .paper-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    .paper-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 10px;
    }
    
    .paper-title {
        font-weight: bold;
        margin-bottom: 5px;
        color: var(--primary-color);
    }
    
    .paper-authors {
        font-size: 14px;
        color: #7f8c8d;
        margin-bottom: 10px;
    }
    
    .paper-meta {
        font-size: 12px;
        color: #95a5a6;
        margin: 10px 0;
        display: flex;
        justify-content: space-between;
    }
    
    .paper-tag {
        display: inline-block;
        background-color: var(--secondary-color);
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
    }
    
    .paper-actions {
        display: flex;
        gap: 10px;
        margin-top: 15px;
    }
    
    .paper-actions button {
        font-size: 14px;
        padding: 5px 10px;
    }
    
    .select-all-container {
        display: flex;
        align-items: center;
        margin-top: 20px;
    }
    
    .select-all-container label {
        margin: 0 15px 0 5px;
        display: inline;
    }
`;
document.head.appendChild(paperListStyles);

// Fetch papers from the server
async function fetchPapers() {
    try {
        papersContainer.innerHTML = '<div class="loading">Loading papers...</div>';
        
        const response = await fetch('/api/papers');
        if (!response.ok) {
            throw new Error('Failed to fetch papers');
        }
        
        state.papers = await response.json();
        
        // Extract unique tags
        state.papers.forEach(paper => {
            if (paper.tag) {
                state.tags.add(paper.tag);
            }
        });
        
        // Populate tag filter
        populateTagFilter();
        
        // Apply initial filtering
        applyFilters();
        
    } catch (error) {
        console.error('Error fetching papers:', error);
        papersContainer.innerHTML = `<div class="no-results">Error loading papers: ${error.message}</div>`;
    }
}

// Populate tag filter dropdown
function populateTagFilter() {
    const sortedTags = Array.from(state.tags).sort();
    
    // Clear existing options except the first one
    while (tagFilter.options.length > 1) {
        tagFilter.remove(1);
    }
    
    sortedTags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagFilter.appendChild(option);
    });
}

// Apply filters based on search text and tag
function applyFilters() {
    const { searchText, tag } = state.currentFilter;
    
    state.filteredPapers = state.papers.filter(paper => {
        // Filter by tag if selected
        if (tag && paper.tag !== tag) {
            return false;
        }
        
        // Filter by search text if provided
        if (searchText) {
            const searchLower = searchText.toLowerCase();
            const titleMatch = paper.title && paper.title.toLowerCase().includes(searchLower);
            const abstractMatch = paper.abstract && paper.abstract.toLowerCase().includes(searchLower);
            
            // Check authors
            let authorMatch = false;
            if (Array.isArray(paper.authors)) {
                authorMatch = paper.authors.some(author => 
                    author.toLowerCase().includes(searchLower)
                );
            } else if (typeof paper.authors === 'string') {
                authorMatch = paper.authors.toLowerCase().includes(searchLower);
            }
            
            return titleMatch || abstractMatch || authorMatch;
        }
        
        return true;
    });
    
    renderPapers();
    updateSelectAllState();
}

// Render papers to the DOM
function renderPapers() {
    if (state.filteredPapers.length === 0) {
        papersContainer.innerHTML = '<div class="no-results">No papers found matching your criteria</div>';
        return;
    }
    
    papersContainer.innerHTML = '';
    
    // Get the template
    const template = document.getElementById('paper-template');
    
    state.filteredPapers.forEach(paper => {
        // Clone the template
        const paperElement = document.importNode(template.content, true).firstElementChild;
        
        // Set paper data
        const checkbox = paperElement.querySelector('.paper-checkbox');
        checkbox.dataset.id = paper.id;
        checkbox.checked = state.selectedPapers.has(paper.id);
        
        const tagElement = paperElement.querySelector('.paper-tag');
        if (paper.tag) {
            tagElement.textContent = paper.tag;
        } else {
            tagElement.style.display = 'none';
        }
        
        paperElement.querySelector('.paper-title').textContent = paper.title;
        
        const authorsElement = paperElement.querySelector('.paper-authors');
        if (Array.isArray(paper.authors)) {
            authorsElement.textContent = paper.authors.join(', ');
        } else if (typeof paper.authors === 'string') {
            authorsElement.textContent = paper.authors;
        }
        
        const dateElement = paperElement.querySelector('.paper-date');
        if (paper.publishedDate) {
            dateElement.textContent = `Published: ${new Date(paper.publishedDate).toLocaleDateString()}`;
        } else if (paper.dateAdded) {
            dateElement.textContent = `Added: ${new Date(paper.dateAdded).toLocaleDateString()}`;
        }
        
        paperElement.querySelector('.paper-id').textContent = `arXiv ID: ${paper.arxivId || paper.id}`;
        
        // Set up PDF button
        const pdfButton = paperElement.querySelector('.view-pdf-button');
        if (paper.localPdfPath) {
            pdfButton.addEventListener('click', () => viewPdf(paper.id));
        } else {
            pdfButton.disabled = true;
            pdfButton.title = 'PDF not available locally';
        }
        
        // Set up source button
        const sourceButton = paperElement.querySelector('.view-source-button');
        if (paper.localSourcePath) {
            sourceButton.addEventListener('click', () => viewSource(paper.id));
        } else {
            sourceButton.disabled = true;
            sourceButton.title = 'Source not available locally';
        }
        
        // Add to container
        papersContainer.appendChild(paperElement);
    });
    
    // Add event listeners to checkboxes
    document.querySelectorAll('.paper-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handlePaperSelection);
    });
    
    updateButtonStates();
}

// Handle paper selection
function handlePaperSelection(e) {
    const checkbox = e.target;
    const paperId = checkbox.dataset.id;
    
    if (checkbox.checked) {
        state.selectedPapers.add(paperId);
    } else {
        state.selectedPapers.delete(paperId);
    }
    
    updateButtonStates();
    updateSelectAllState();
}

// Update select all checkbox state
function updateSelectAllState() {
    if (state.filteredPapers.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.disabled = true;
    } else {
        selectAllCheckbox.disabled = false;
        
        const allSelected = state.filteredPapers.every(paper => 
            state.selectedPapers.has(paper.id)
        );
        
        selectAllCheckbox.checked = allSelected;
    }
}

// Update button states based on selection
function updateButtonStates() {
    const hasSelection = state.selectedPapers.size > 0;
    deleteSelectedButton.disabled = !hasSelection;
    
    // Update BibTeX buttons state
    previewBibtexButton.disabled = !hasSelection;
    copyBibtexButton.disabled = !hasSelection;
    exportBibtexButton.disabled = !hasSelection;
}

// Delete selected papers
async function deleteSelectedPapers() {
    if (state.selectedPapers.size === 0) return;
    
    const confirmDelete = confirm(`Are you sure you want to delete ${state.selectedPapers.size} paper(s)?`);
    if (!confirmDelete) return;
    
    try {
        const response = await fetch('/api/papers', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ids: Array.from(state.selectedPapers)
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete papers');
        }
        
        showAlert(`Successfully deleted ${state.selectedPapers.size} paper(s)`, 'success');
        
        // Clear selection and refresh papers
        state.selectedPapers.clear();
        await fetchPapers();
        
    } catch (error) {
        console.error('Error deleting papers:', error);
        showAlert(`Error: ${error.message}`, 'error');
    }
}

// View PDF
function viewPdf(paperId) {
    fetch(`/api/pdf/${paperId}`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Failed to open PDF');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                showAlert('PDF opened in your default application', 'success');
            }
        })
        .catch(error => {
            console.error('Error opening PDF:', error);
            showAlert(`Error: ${error.message}`, 'error');
        });
}

// View Source
function viewSource(paperId) {
    fetch(`/api/source/${paperId}`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Failed to extract source');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                showAlert('Source extracted and opened in your file explorer', 'success');
            }
        })
        .catch(error => {
            console.error('Error extracting source:', error);
            showAlert(`Error: ${error.message}`, 'error');
        });
}

// Event Listeners
searchInput.addEventListener('input', (e) => {
    state.currentFilter.searchText = e.target.value;
    applyFilters();
});

tagFilter.addEventListener('change', (e) => {
    state.currentFilter.tag = e.target.value;
    applyFilters();
});

selectAllCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
        // Select all visible papers
        state.filteredPapers.forEach(paper => {
            state.selectedPapers.add(paper.id);
        });
    } else {
        // Deselect all papers
        state.selectedPapers.clear();
    }
    
    renderPapers();
    updateButtonStates();
});

deleteSelectedButton.addEventListener('click', deleteSelectedPapers);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchPapers();
    
    // Event listeners
    searchInput.addEventListener('input', (e) => {
        state.currentFilter.searchText = e.target.value;
        applyFilters();
    });
    
    tagFilter.addEventListener('change', (e) => {
        state.currentFilter.tag = e.target.value;
        applyFilters();
    });
    
    selectAllCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            // Select all visible papers
            state.filteredPapers.forEach(paper => {
                state.selectedPapers.add(paper.id);
            });
        } else {
            // Deselect all papers
            state.selectedPapers.clear();
        }
        
        renderPapers();
        updateButtonStates();
    });
    
    deleteSelectedButton.addEventListener('click', deleteSelectedPapers);
}); 