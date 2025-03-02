// DOM Elements
const paperUrlInput = document.getElementById('paper-url');
const paperTagInput = document.getElementById('paper-tag');
const downloadTagButtons = document.getElementById('download-tag-buttons');
const downloadButton = document.getElementById('download-button');

// 添加按钮状态样式
const downloadButtonStyles = document.createElement('style');
downloadButtonStyles.textContent = `
    .button-loading {
        position: relative;
        pointer-events: none;
    }
    
    .button-loading::after {
        content: '';
        position: absolute;
        width: 16px;
        height: 16px;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        margin: auto;
        border: 3px solid transparent;
        border-top-color: white;
        border-radius: 50%;
        animation: button-loading-spinner 1s ease infinite;
    }
    
    @keyframes button-loading-spinner {
        from {
            transform: rotate(0turn);
        }
        
        to {
            transform: rotate(1turn);
        }
    }
    
    .button-success {
        background-color: var(--success-color);
    }
    
    .new-tag-container {
        display: inline-flex;
        align-items: center;
        background-color: var(--success-color);
        border-radius: 16px;
        padding: 0 6px 0 12px;
        color: white;
        transition: all 0.2s;
    }
    
    .new-tag-input {
        background: transparent;
        border: none;
        color: white;
        font-size: 14px;
        width: 100px;
        padding: 6px 0;
        outline: none;
        font-family: inherit;
    }
    
    .new-tag-input::placeholder {
        color: rgba(255, 255, 255, 0.8);
    }
    
    .new-tag-add {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0 4px;
        font-size: 14px;
    }
    
    .new-tag-error {
        color: #e74c3c;
        font-size: 12px;
        margin-top: 4px;
        display: none;
    }
`;
document.head.appendChild(downloadButtonStyles);

// Populate tag buttons for download page
function populateDownloadTagButtons() {
    // Clear existing buttons
    downloadTagButtons.innerHTML = '';
    
    // Add default tag button
    const defaultTagButton = document.createElement('span');
    defaultTagButton.className = 'tag-button' + (paperTagInput.value === 'default' ? ' selected' : '');
    defaultTagButton.textContent = 'default';
    defaultTagButton.dataset.tag = 'default';
    defaultTagButton.addEventListener('click', () => selectDownloadTag('default'));
    downloadTagButtons.appendChild(defaultTagButton);
    
    // Add existing tags from papers
    if (state && state.tags) {
        const sortedTags = Array.from(state.tags).sort();
        
        sortedTags.forEach(tag => {
            if (tag !== 'default') {
                const tagButton = document.createElement('span');
                tagButton.className = 'tag-button' + (paperTagInput.value === tag ? ' selected' : '');
                tagButton.textContent = tag;
                tagButton.dataset.tag = tag;
                tagButton.addEventListener('click', () => selectDownloadTag(tag));
                downloadTagButtons.appendChild(tagButton);
            }
        });
    }
    
    // Add "New Tag" input container
    const newTagContainer = document.createElement('div');
    newTagContainer.className = 'new-tag-container';
    
    // Create input field
    const newTagInput = document.createElement('input');
    newTagInput.type = 'text';
    newTagInput.className = 'new-tag-input';
    newTagInput.placeholder = 'New tag...';
    newTagInput.maxLength = 30;
    
    // Create add button
    const addButton = document.createElement('button');
    addButton.className = 'new-tag-add';
    addButton.innerHTML = '<i class="fas fa-plus"></i>';
    addButton.title = 'Add new tag';
    
    // Create error message element
    const errorMessage = document.createElement('div');
    errorMessage.className = 'new-tag-error';
    errorMessage.textContent = 'Tag already exists';
    
    // Add elements to container
    newTagContainer.appendChild(newTagInput);
    newTagContainer.appendChild(addButton);
    
    // Add container to buttons
    downloadTagButtons.appendChild(newTagContainer);
    downloadTagButtons.appendChild(errorMessage);
    
    // Add event listeners
    function handleAddTag() {
        const newTagName = newTagInput.value.trim();
        if (newTagName) {
            // Check if tag already exists
            if (state && state.tags && state.tags.has(newTagName)) {
                // Show error message
                errorMessage.style.display = 'block';
                setTimeout(() => {
                    errorMessage.style.display = 'none';
                }, 3000);
                return;
            }
            
            // Add to state.tags
            if (state && state.tags) {
                state.tags.add(newTagName);
            }
            
            // Create new button
            const tagButton = document.createElement('span');
            tagButton.className = 'tag-button selected';
            tagButton.textContent = newTagName;
            tagButton.dataset.tag = newTagName;
            tagButton.addEventListener('click', () => selectDownloadTag(newTagName));
            
            // Insert before the new tag container
            downloadTagButtons.insertBefore(tagButton, newTagContainer);
            
            // Select the new tag
            selectDownloadTag(newTagName);
            
            // Clear input
            newTagInput.value = '';
        }
    }
    
    addButton.addEventListener('click', handleAddTag);
    newTagInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAddTag();
        }
    });
}

// Select a tag for download
function selectDownloadTag(tag) {
    // Update hidden input value
    paperTagInput.value = tag;
    
    // Update button states
    downloadTagButtons.querySelectorAll('.tag-button[data-tag]').forEach(button => {
        button.classList.toggle('selected', button.dataset.tag === tag);
    });
}

// Download a paper
async function downloadPaper() {
    // Validate URL
    const url = paperUrlInput.value.trim();
    if (!url) {
        showAlert('Please enter a valid arXiv URL', 'error');
        return;
    }
    
    // Check if URL is an arXiv URL
    if (!url.includes('arxiv.org')) {
        showAlert('URL must be from arxiv.org', 'error');
        return;
    }
    
    // Get tag
    const tag = paperTagInput.value.trim() || 'default';
    
    // Disable button and show loading
    downloadButton.disabled = true;
    const originalText = downloadButton.innerHTML;
    downloadButton.innerHTML = '<span style="opacity: 0;">Downloading...</span>';
    downloadButton.classList.add('button-loading');
    showAlert('Downloading paper, this may take a moment...', 'success');
    
    try {
        const response = await fetch('/api/papers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url, tag })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to download paper');
        }
        
        const data = await response.json();
        
        if (data.success) {
            // 显示成功状态
            downloadButton.classList.remove('button-loading');
            downloadButton.classList.add('button-success');
            downloadButton.innerHTML = '<i class="fas fa-check"></i> Downloaded';
            
            showAlert('Paper downloaded successfully!', 'success');
            
            // Clear inputs
            paperUrlInput.value = '';
            
            // Refresh papers list if we're on the papers tab
            if (state.activeTab === 'list-tab') {
                fetchPapers();
            }
            
            // 延迟恢复按钮状态
            setTimeout(() => {
                downloadButton.classList.remove('button-success');
                downloadButton.disabled = false;
                downloadButton.innerHTML = originalText;
            }, 2000);
        }
    } catch (error) {
        console.error('Error downloading paper:', error);
        showAlert(`Error: ${error.message}`, 'error');
        
        // 恢复按钮状态
        downloadButton.classList.remove('button-loading');
        downloadButton.disabled = false;
        downloadButton.innerHTML = originalText;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set default tag
    paperTagInput.value = 'default';
    
    // Populate tag buttons
    populateDownloadTagButtons();
    
    // Event Listeners
    downloadButton.addEventListener('click', downloadPaper);
    
    // Allow pressing Enter in the URL input to trigger download
    paperUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            downloadPaper();
        }
    });
    
    // Update tag buttons when switching to download tab
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (link.getAttribute('data-tab') === 'download-tab') {
                populateDownloadTagButtons();
            }
        });
    });
}); 