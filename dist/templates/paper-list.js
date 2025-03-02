// DOM Elements
const papersContainer = document.getElementById('papers-container');
const searchInput = document.getElementById('search-input');
const tagFilterButtons = document.getElementById('tag-filter-buttons');
const selectAllCheckbox = document.getElementById('select-all');
const deleteSelectedButton = document.getElementById('delete-selected');
const openKnowledgeBaseButton = document.getElementById('open-kb-button');
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
        min-width: 0; /* Prevent content overflow */
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
    
    .paper-title:hover {
        text-decoration: underline;
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
        flex-wrap: wrap;
        gap: 15px;
        align-items: center;
    }
    
    .paper-tag {
        display: inline-block;
        background-color: var(--secondary-color);
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        white-space: nowrap;
    }
    
    .paper-subjects {
        font-style: italic;
        color: #7f8c8d;
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
        margin-bottom: 15px;
    }
    
    .select-all-container label {
        margin: 0 0 0 5px;
        display: inline;
    }
    
    .select-all-container .action-buttons {
        margin-left: auto;
        margin-top: 0;
    }
    
    .edit-button {
        color: var(--info-color);
        background: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
        padding: 0;
        margin-left: 5px;
    }
    
    .edit-button:hover {
        color: #2980b9;
    }
    
    .dropdown {
        position: relative;
        display: inline-block;
    }
    
    .dropdown-content {
        display: none;
        position: absolute;
        right: 0;
        background-color: var(--card-color);
        min-width: 160px;
        box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
        z-index: 1;
        border-radius: 4px;
    }
    
    .dropdown-content a {
        color: var(--text-color);
        padding: 8px 12px;
        text-decoration: none;
        display: block;
        font-size: 14px;
    }
    
    .dropdown-content a:hover {
        background-color: #f1f1f1;
    }
    
    .dropdown:hover .dropdown-content {
        display: block;
    }
    
    .more-actions-button {
        background: none;
        border: none;
        color: var(--text-color);
        cursor: pointer;
        font-size: 16px;
        padding: 4px;
    }
`;
document.head.appendChild(paperListStyles);

// Fetch papers from API
async function fetchPapers() {
    try {
        const response = await fetch('/api/papers');
        
        if (!response.ok) {
            throw new Error('Failed to fetch papers');
        }
        
        const papers = await response.json();
        
        // Update state
        state.papers = papers;
        
        // Extract tags
        state.tags = new Set(papers.map(paper => paper.tag || 'default').filter(Boolean));
        
        // Apply current filter
        filterPapers();
        
        // Populate tag filter buttons
        populateTagFilterButtons();
        
        // Update download tag buttons if on download tab
        if (state.activeTab === 'download-tab') {
            populateDownloadTagButtons();
        }
    } catch (error) {
        console.error('Error fetching papers:', error);
        papersContainer.innerHTML = `<div class="no-results">Error loading papers: ${error.message}</div>`;
    }
}

// Filter papers based on search text and tag
function filterPapers() {
    const { searchText, tag } = state.currentFilter;
    
    if (!searchText && !tag) {
        state.filteredPapers = [...state.papers];
    } else {
        state.filteredPapers = state.papers.filter(paper => {
            // Filter by tag if specified
            if (tag && paper.tag !== tag) {
                return false;
            }
            
            // Filter by search text if specified
            if (searchText) {
                const searchLower = searchText.toLowerCase();
                return (
                    paper.title.toLowerCase().includes(searchLower) ||
                    (typeof paper.authors === 'string' && paper.authors.toLowerCase().includes(searchLower)) ||
                    (Array.isArray(paper.authors) && paper.authors.some(author => author.toLowerCase().includes(searchLower))) ||
                    (paper.abstract && paper.abstract.toLowerCase().includes(searchLower)) ||
                    (paper.id && paper.id.toLowerCase().includes(searchLower))
                );
            }
            
            return true;
        });
    }
    
    // Clear selected papers that are no longer in filtered list
    const filteredIds = new Set(state.filteredPapers.map(p => p.id));
    state.selectedPapers.forEach(id => {
        if (!filteredIds.has(id)) {
            state.selectedPapers.delete(id);
        }
    });
    
    // Render papers
    renderPapers();
}

// Populate tag filter buttons
function populateTagFilterButtons() {
    // Clear existing buttons
    tagFilterButtons.innerHTML = '';
    
    // Add "All" button
    const allButton = document.createElement('span');
    allButton.className = 'tag-button' + (!state.currentFilter.tag ? ' active' : '');
    allButton.textContent = 'All';
    allButton.addEventListener('click', () => {
        state.currentFilter.tag = '';
        
        // Update active state
        tagFilterButtons.querySelectorAll('.tag-button').forEach(btn => btn.classList.remove('active'));
        allButton.classList.add('active');
        
        // Filter papers
        filterPapers();
    });
    tagFilterButtons.appendChild(allButton);
    
    // Add tag buttons
    if (state.tags) {
        const sortedTags = Array.from(state.tags).sort();
        
        sortedTags.forEach(tag => {
            const tagButton = document.createElement('span');
            tagButton.className = 'tag-button' + (state.currentFilter.tag === tag ? ' active' : '');
            tagButton.textContent = tag;
            tagButton.addEventListener('click', () => {
                state.currentFilter.tag = tag;
                
                // Update active state
                tagFilterButtons.querySelectorAll('.tag-button').forEach(btn => btn.classList.remove('active'));
                tagButton.classList.add('active');
                
                // Filter papers
                filterPapers();
            });
            tagFilterButtons.appendChild(tagButton);
        });
    }
}

// Update button states based on selection
function updateButtonStates() {
    const hasSelection = state.selectedPapers.size > 0;
    
    deleteSelectedButton.disabled = !hasSelection;
    previewBibtexButton.disabled = !hasSelection;
    copyBibtexButton.disabled = !hasSelection;
    exportBibtexButton.disabled = !hasSelection;
}

// Update select all checkbox state
function updateSelectAllState() {
    if (state.filteredPapers.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.disabled = true;
    } else {
        selectAllCheckbox.disabled = false;
        selectAllCheckbox.checked = state.filteredPapers.length === state.selectedPapers.size;
    }
    
    updateButtonStates();
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
        
        const titleElement = paperElement.querySelector('.paper-title');
        titleElement.textContent = paper.title;
        
        // Make title clickable to open arxiv website
        titleElement.style.cursor = 'pointer';
        titleElement.addEventListener('click', () => {
            const arxivUrl = `https://arxiv.org/abs/${paper.arxivId || paper.id}`;
            window.open(arxivUrl, '_blank');
        });
        
        const authorsElement = paperElement.querySelector('.paper-authors');
        if (Array.isArray(paper.authors)) {
            authorsElement.textContent = paper.authors.join(', ');
        } else if (typeof paper.authors === 'string') {
            authorsElement.textContent = paper.authors;
        }
        
        // Set up meta information
        const metaElement = paperElement.querySelector('.paper-meta');
        
        // Date added
        const dateElement = paperElement.querySelector('.paper-date');
        if (paper.publishedDate) {
            dateElement.textContent = `Published: ${new Date(paper.publishedDate).toLocaleDateString()}`;
        } else if (paper.dateAdded) {
            dateElement.textContent = `Added: ${new Date(paper.dateAdded).toLocaleDateString()}`;
        }
        
        // ArXiv ID
        paperElement.querySelector('.paper-id').textContent = `arXiv ID: ${paper.arxivId || paper.id}`;
        
        // Add tag to meta section
        if (paper.tag) {
            const tagElement = document.createElement('span');
            tagElement.className = 'paper-tag';
            tagElement.textContent = paper.tag;
            metaElement.appendChild(tagElement);
        }
        
        // Add subjects if available
        if (paper.categories) {
            const subjectsElement = document.createElement('span');
            subjectsElement.className = 'paper-subjects';
            subjectsElement.textContent = `Subjects: ${paper.categories}`;
            metaElement.appendChild(subjectsElement);
        }
        
        // Set up action buttons
        const actionsContainer = paperElement.querySelector('.paper-actions');
        
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
        
        // Add GitHub button
        const githubButton = document.createElement('button');
        githubButton.className = 'button-info';
        githubButton.innerHTML = '<i class="fab fa-github"></i> GitHub';
        
        if (paper.githubUrl) {
            // If GitHub URL exists, open the remote repository
            githubButton.addEventListener('click', () => {
                window.open(paper.githubUrl, '_blank');
            });
        } else {
            // If no GitHub URL, prompt user to enter one
            githubButton.addEventListener('click', () => {
                promptGithubUrl(paper.id);
            });
        }
        actionsContainer.appendChild(githubButton);
        
        // Add Open button (opens parent directory)
        const openButton = document.createElement('button');
        openButton.className = 'button-info';
        openButton.innerHTML = '<i class="fas fa-folder-open"></i> Open';
        openButton.addEventListener('click', () => openPaperDirectory(paper.id));
        actionsContainer.appendChild(openButton);
        
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

// Handle select all checkbox
function handleSelectAll() {
    if (selectAllCheckbox.checked) {
        // Select all papers
        state.filteredPapers.forEach(paper => {
            state.selectedPapers.add(paper.id);
        });
    } else {
        // Deselect all papers
        state.selectedPapers.clear();
    }
    
    // Update checkboxes
    document.querySelectorAll('.paper-checkbox').forEach(checkbox => {
        checkbox.checked = state.selectedPapers.has(checkbox.dataset.id);
    });
    
    updateButtonStates();
}

// Delete selected papers
async function deleteSelectedPapers() {
    if (state.selectedPapers.size === 0) {
        return;
    }
    
    const confirmDelete = confirm(`Are you sure you want to delete ${state.selectedPapers.size} paper(s)?`);
    if (!confirmDelete) {
        return;
    }
    
    try {
        const response = await fetch('/api/papers/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ids: Array.from(state.selectedPapers)
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete papers');
        }
        
        showAlert(`Successfully deleted ${state.selectedPapers.size} paper(s)`, 'success');
        
        // Clear selected papers
        state.selectedPapers.clear();
        
        // Refresh papers
        fetchPapers();
    } catch (error) {
        console.error('Error deleting papers:', error);
        showAlert(`Error: ${error.message}`, 'error');
    }
}

// View PDF
function viewPdf(paperId) {
    fetch(`/api/pdf/${paperId}`, {
        method: 'GET'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to open PDF');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showAlert('Opening PDF...', 'success');
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    })
    .catch(error => {
        console.error('Error opening PDF:', error);
        showAlert(`Error: ${error.message}`, 'error');
    });
}

// View source
function viewSource(paperId) {
    fetch(`/api/source/${paperId}`, {
        method: 'GET'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to extract source');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showAlert('Extracting and opening source files...', 'success');
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    })
    .catch(error => {
        console.error('Error extracting source:', error);
        showAlert(`Error: ${error.message}`, 'error');
    });
}

// Prompt for GitHub URL and clone repository
function promptGithubUrl(paperId) {
    const githubUrl = prompt('Enter GitHub repository URL:');
    
    if (!githubUrl) {
        return; // User cancelled
    }
    
    // Validate URL format
    if (!githubUrl.startsWith('https://github.com/')) {
        showAlert('Please enter a valid GitHub URL (https://github.com/...)', 'error');
        return;
    }
    
    // First update the paper with the GitHub URL
    fetch(`/api/papers/${paperId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            githubUrl: githubUrl
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update paper');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showAlert('GitHub URL saved. Cloning repository...', 'success');
            
            // Now clone the repository
            return fetch(`/api/github/clone/${paperId}`, {
                method: 'POST'
            });
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to clone repository');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showAlert('GitHub repository cloned successfully!', 'success');
            // Refresh papers to update UI
            fetchPapers();
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    })
    .catch(error => {
        console.error('Error handling GitHub URL:', error);
        showAlert(`Error: ${error.message}`, 'error');
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Fetch papers
    fetchPapers();
    
    // Event listeners
    searchInput.addEventListener('input', () => {
        state.currentFilter.searchText = searchInput.value.trim();
        filterPapers();
    });
    
    selectAllCheckbox.addEventListener('change', handleSelectAll);
    deleteSelectedButton.addEventListener('click', deleteSelectedPapers);
    
    // Open knowledge base button
    if (openKnowledgeBaseButton) {
        openKnowledgeBaseButton.addEventListener('click', openKnowledgeBase);
    }
}); 