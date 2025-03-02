// DOM Elements
const paperUrlInput = document.getElementById('paper-url');
const paperTagInput = document.getElementById('paper-tag');
const downloadButton = document.getElementById('download-button');
const downloadStatus = document.getElementById('download-status');

// Download a paper
async function downloadPaper() {
    // Validate URL
    const url = paperUrlInput.value.trim();
    if (!url) {
        showDownloadAlert('Please enter a valid arXiv URL', 'error');
        return;
    }
    
    // Check if URL is an arXiv URL
    if (!url.includes('arxiv.org')) {
        showDownloadAlert('URL must be from arxiv.org', 'error');
        return;
    }
    
    // Get tag
    const tag = paperTagInput.value.trim() || 'default';
    
    // Disable button and show loading
    downloadButton.disabled = true;
    downloadButton.textContent = 'Downloading...';
    showDownloadAlert('Downloading paper, this may take a moment...', 'info');
    
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
            showDownloadAlert('Paper downloaded successfully!', 'success');
            
            // Clear inputs
            paperUrlInput.value = '';
            
            // Refresh papers list if we're on the papers tab
            if (state.activeTab === 'papers-tab') {
                fetchPapers();
            }
        }
    } catch (error) {
        console.error('Error downloading paper:', error);
        showDownloadAlert(`Error: ${error.message}`, 'error');
    } finally {
        // Re-enable button
        downloadButton.disabled = false;
        downloadButton.textContent = 'Download Paper';
    }
}

// Show download status alert
function showDownloadAlert(message, type) {
    downloadStatus.textContent = message;
    downloadStatus.className = `alert alert-${type}`;
    downloadStatus.style.display = 'block';
    
    // Auto-hide success and info messages after 5 seconds
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            downloadStatus.style.display = 'none';
        }, 5000);
    }
}

// Event Listeners
downloadButton.addEventListener('click', downloadPaper);

// Allow pressing Enter in the URL input to trigger download
paperUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        downloadPaper();
    }
}); 