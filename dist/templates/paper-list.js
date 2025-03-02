// DOM Elements
const papersContainer = document.getElementById('papers-container');
const searchInput = document.getElementById('search-input');
const tagFilterButtons = document.getElementById('tag-filter-buttons');
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
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 20px;
    }
    
    .paper-card {
        background-color: var(--card-color);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 12px 15px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        transition: background-color 0.2s;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 15px;
    }
    
    .paper-card:hover {
        background-color: #f8f9fa;
    }
    
    .paper-header {
        display: flex;
        align-items: center;
        min-width: 30px;
    }
    
    .paper-content {
        flex: 1;
        min-width: 0; /* 防止内容溢出 */
    }
    
    .paper-title {
        font-weight: 600;
        margin-bottom: 5px;
        color: var(--primary-color);
        font-size: 15px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .paper-authors {
        font-size: 13px;
        color: #7f8c8d;
        margin-bottom: 5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .paper-meta {
        font-size: 12px;
        color: #95a5a6;
        display: flex;
        gap: 15px;
    }
    
    .paper-tag {
        display: inline-block;
        background-color: var(--secondary-color);
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        white-space: nowrap;
        margin-right: auto;
    }
    
    .paper-actions {
        display: flex;
        gap: 8px;
        margin-left: auto;
        align-items: center;
    }
    
    .paper-actions button {
        font-size: 13px;
        padding: 4px 8px;
        white-space: nowrap;
    }
    
    .select-all-container {
        display: flex;
        align-items: center;
        margin-top: 20px;
        margin-bottom: 20px;
        flex-wrap: wrap;
    }
    
    .select-all-container label {
        margin: 0 15px 0 5px;
        display: inline;
    }
    
    /* 统一按钮样式和对齐方式 */
    .action-buttons {
        display: inline-flex;
        gap: 10px;
        margin-left: auto;
        vertical-align: middle;
        flex-wrap: wrap;
    }
    
    .action-buttons button {
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    #delete-selected {
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    /* 响应式设计 */
    @media (max-width: 768px) {
        .paper-card {
            flex-direction: column;
            align-items: flex-start;
        }
        
        .paper-header {
            width: 100%;
            justify-content: space-between;
        }
        
        .paper-actions {
            margin-left: 0;
            width: 100%;
            justify-content: flex-end;
            margin-top: 10px;
            flex-wrap: wrap;
        }
        
        .paper-tag {
            margin-right: 0;
            margin-bottom: 5px;
        }
        
        .action-buttons {
            margin-left: 0;
            width: 100%;
            justify-content: flex-end;
        }
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
        state.tags.clear();
        state.papers.forEach(paper => {
            if (paper.tag) {
                state.tags.add(paper.tag);
            }
        });
        
        // Populate tag filter buttons
        populateTagFilterButtons();
        
        // Apply initial filtering
        applyFilters();
        
    } catch (error) {
        console.error('Error fetching papers:', error);
        papersContainer.innerHTML = `<div class="no-results">Error loading papers: ${error.message}</div>`;
    }
}

// Populate tag filter buttons
function populateTagFilterButtons() {
    const sortedTags = Array.from(state.tags).sort();
    
    // Clear existing buttons
    tagFilterButtons.innerHTML = '';
    
    // Add "All Tags" button
    const allTagsButton = document.createElement('span');
    allTagsButton.className = 'tag-button' + (state.currentFilter.tags.length === 0 ? ' active' : '');
    allTagsButton.textContent = 'All Tags';
    allTagsButton.dataset.tag = '';
    allTagsButton.addEventListener('click', () => {
        // Clear all selected tags
        state.currentFilter.tags = [];
        updateTagButtonsState();
        applyFilters();
    });
    tagFilterButtons.appendChild(allTagsButton);
    
    // Add tag buttons
    sortedTags.forEach(tag => {
        const tagButton = document.createElement('span');
        tagButton.className = 'tag-button' + (state.currentFilter.tags.includes(tag) ? ' active' : '');
        tagButton.textContent = tag;
        tagButton.dataset.tag = tag;
        tagButton.addEventListener('click', () => {
            // Toggle tag selection
            if (state.currentFilter.tags.includes(tag)) {
                state.currentFilter.tags = state.currentFilter.tags.filter(t => t !== tag);
            } else {
                state.currentFilter.tags.push(tag);
            }
            updateTagButtonsState();
            applyFilters();
        });
        tagFilterButtons.appendChild(tagButton);
    });
}

// Update tag buttons state
function updateTagButtonsState() {
    // Update "All Tags" button
    const allTagsButton = tagFilterButtons.querySelector('[data-tag=""]');
    if (allTagsButton) {
        allTagsButton.classList.toggle('active', state.currentFilter.tags.length === 0);
    }
    
    // Update individual tag buttons
    tagFilterButtons.querySelectorAll('.tag-button[data-tag]:not([data-tag=""])').forEach(button => {
        const tag = button.dataset.tag;
        button.classList.toggle('active', state.currentFilter.tags.includes(tag));
    });
}

// Apply filters based on search text and tags
function applyFilters() {
    const { searchText, tags } = state.currentFilter;
    
    state.filteredPapers = state.papers.filter(paper => {
        // Filter by tags if selected
        if (tags.length > 0 && (!paper.tag || !tags.includes(paper.tag))) {
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
    // Update state to include tags array
    state.currentFilter.tags = [];
    
    fetchPapers();
    
    // Event listeners
    searchInput.addEventListener('input', (e) => {
        state.currentFilter.searchText = e.target.value;
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