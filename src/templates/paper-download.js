// DOM Elements
const paperUrlInput = document.getElementById('paper-url');
const paperTagInput = document.getElementById('paper-tag');
const paperGithubInput = document.getElementById('paper-github');
const downloadTagButtons = document.getElementById('download-tag-buttons');
const downloadButton = document.getElementById('download-button');
const paperTagSelect = document.getElementById('paper-tag-select');

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

// Populate tag selector for download page
function populateTagSelector() {
    // Clear existing options (except the first one)
    while (paperTagSelect.options.length > 1) {
        paperTagSelect.remove(1);
    }
    
    // Add default tag option if not already present
    if (paperTagSelect.options.length === 1) {
        const defaultOption = document.createElement('option');
        defaultOption.value = 'default';
        defaultOption.textContent = 'default';
        paperTagSelect.appendChild(defaultOption);
    }
    
    // Add existing tags from papers
    if (state && state.tags) {
        const sortedTags = Array.from(state.tags).sort();
        
        sortedTags.forEach(tag => {
            if (tag !== 'default') {
                const option = document.createElement('option');
                option.value = tag;
                option.textContent = tag;
                paperTagSelect.appendChild(option);
            }
        });
    }
    
    // Add option for creating a new tag
    const newTagOption = document.createElement('option');
    newTagOption.value = 'new';
    newTagOption.textContent = '+ Create new tag';
    paperTagSelect.appendChild(newTagOption);
    
    // Update tag buttons display
    updateTagButtonsDisplay();
    
    // Add event listener to select
    paperTagSelect.addEventListener('change', handleTagSelectChange);
}

// Handle tag select change
function handleTagSelectChange() {
    const selectedValue = paperTagSelect.value;
    
    if (selectedValue === 'new') {
        // Show input for new tag
        showNewTagInput();
    } else {
        // Update hidden input and tag buttons
        paperTagInput.value = selectedValue;
        updateTagButtonsDisplay();
    }
}

// Show input for creating a new tag
function showNewTagInput() {
    // Clear existing buttons
    downloadTagButtons.innerHTML = '';
    
    // Create input container
    const newTagContainer = document.createElement('div');
    newTagContainer.className = 'input-group';
    
    // Create input field
    const newTagInput = document.createElement('input');
    newTagInput.type = 'text';
    newTagInput.className = 'form-control';
    newTagInput.placeholder = 'Enter new tag name';
    newTagInput.maxLength = 30;
    
    // Create add button
    const addButton = document.createElement('button');
    addButton.className = 'btn btn-success';
    addButton.innerHTML = '<i class="fas fa-check"></i>';
    addButton.type = 'button';
    
    // Create cancel button
    const cancelButton = document.createElement('button');
    cancelButton.className = 'btn btn-outline-secondary';
    cancelButton.innerHTML = '<i class="fas fa-times"></i>';
    cancelButton.type = 'button';
    
    // Add elements to container
    newTagContainer.appendChild(newTagInput);
    const btnGroup = document.createElement('div');
    btnGroup.className = 'input-group-append';
    btnGroup.appendChild(addButton);
    btnGroup.appendChild(cancelButton);
    newTagContainer.appendChild(btnGroup);
    
    // Add container to buttons
    downloadTagButtons.appendChild(newTagContainer);
    
    // Focus input
    newTagInput.focus();
    
    // Add event listeners
    function handleAddTag() {
        const newTagName = newTagInput.value.trim();
        if (newTagName) {
            // Check if tag already exists
            if (state && state.tags && state.tags.has(newTagName)) {
                showToast('Error', 'Tag already exists', 'danger');
                return;
            }
            
            // Add to state.tags
            if (state && state.tags) {
                state.tags.add(newTagName);
            }
            
            // Add to select dropdown
            const option = document.createElement('option');
            option.value = newTagName;
            option.textContent = newTagName;
            
            // Insert before the "Create new tag" option
            paperTagSelect.insertBefore(option, paperTagSelect.lastChild);
            
            // Select the new tag
            paperTagSelect.value = newTagName;
            paperTagInput.value = newTagName;
            
            // Update tag buttons
            updateTagButtonsDisplay();
            
            showToast('Success', `Tag "${newTagName}" created`, 'success');
        }
    }
    
    function handleCancel() {
        // Reset select to previous value
        if (paperTagInput.value) {
            paperTagSelect.value = paperTagInput.value;
        } else {
            paperTagSelect.selectedIndex = 0;
        }
        
        // Update tag buttons
        updateTagButtonsDisplay();
    }
    
    addButton.addEventListener('click', handleAddTag);
    cancelButton.addEventListener('click', handleCancel);
    newTagInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAddTag();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    });
}

// Update tag buttons display based on selected tag
function updateTagButtonsDisplay() {
    // Clear existing buttons
    downloadTagButtons.innerHTML = '';
    
    const selectedTag = paperTagInput.value || paperTagSelect.value;
    
    if (selectedTag && selectedTag !== 'new') {
        // Show the selected tag as a button
        const tagButton = document.createElement('span');
        tagButton.className = 'tag-button selected';
        tagButton.textContent = selectedTag;
        downloadTagButtons.appendChild(tagButton);
    }
}

// Download a paper
async function downloadPaper() {
    // Validate URL
    const url = paperUrlInput.value.trim();
    if (!url) {
        showToast('Error', 'Please enter a valid arXiv URL', 'danger');
        return;
    }
    
    // Check if URL is an arXiv URL
    if (!url.includes('arxiv.org')) {
        showToast('Error', 'URL must be from arxiv.org', 'danger');
        return;
    }
    
    // Get tag
    const tag = paperTagInput.value.trim() || paperTagSelect.value || 'default';
    
    // Get GitHub URL (optional)
    const githubUrl = paperGithubInput.value.trim();
    
    // Disable button and show loading
    downloadButton.disabled = true;
    const originalText = downloadButton.innerHTML;
    downloadButton.innerHTML = '<span style="opacity: 0;">Downloading...</span>';
    downloadButton.classList.add('button-loading');
    showToast('Info', 'Downloading paper, this may take a moment...', 'info');
    
    try {
        const response = await fetch('/api/papers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                url, 
                tag,
                githubUrl: githubUrl || undefined
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to download paper');
        }
        
        const data = await response.json();
        
        // Show success message
        downloadButton.classList.remove('button-loading');
        downloadButton.classList.add('button-success');
        downloadButton.innerHTML = '<i class="fas fa-check"></i> Downloaded';
        showToast('Success', `Paper "${data.title}" downloaded successfully`, 'success');
        
        // Reset form after a delay
        setTimeout(() => {
            paperUrlInput.value = '';
            paperGithubInput.value = '';
            downloadButton.disabled = false;
            downloadButton.classList.remove('button-success');
            downloadButton.innerHTML = originalText;
            
            // Refresh paper list if we're on the list tab
            if (document.getElementById('list-tab').classList.contains('active')) {
                fetchPapers();
            }
        }, 3000);
    } catch (error) {
        console.error('Download error:', error);
        downloadButton.classList.remove('button-loading');
        downloadButton.disabled = false;
        downloadButton.innerHTML = originalText;
        showToast('Error', error.message, 'danger');
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

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize tag selector
    populateTagSelector();
    
    // Add download button event listener
    downloadButton.addEventListener('click', downloadPaper);
}); 