// Global state
const state = {
    papers: [],
    filteredPapers: [],
    selectedPapers: new Set(),
    tags: new Set(),
    currentFilter: {
        searchText: '',
        tag: ''
    },
    activeTab: 'list-tab'
};

// DOM Elements
const tabLinks = document.querySelectorAll('.nav-link');
const tabContents = document.querySelectorAll('.tab-content');

// Tab Navigation
tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all tabs
        tabLinks.forEach(l => l.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab
        link.classList.add('active');
        const tabId = link.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
        state.activeTab = tabId;
        
        // If switching to download tab, update tag selector
        if (tabId === 'download-tab' && typeof populateTagSelector === 'function') {
            populateTagSelector();
        }
    });
});

// Helper function to show alerts
function showAlert(message, type, containerId = 'alert-container') {
    const container = document.getElementById(containerId);
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    
    // Add icon
    const icon = document.createElement('i');
    if (type === 'success') {
        icon.className = 'fas fa-check-circle alert-icon';
    } else {
        icon.className = 'fas fa-exclamation-circle alert-icon';
    }
    alert.appendChild(icon);
    
    // Add message text
    const messageText = document.createElement('span');
    messageText.textContent = message;
    alert.appendChild(messageText);
    
    // Add to container
    container.appendChild(alert);
    
    // Auto hide
    setTimeout(() => {
        alert.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => {
            container.removeChild(alert);
        }, 300);
    }, 5000);
}

// Open the knowledge base directory
function openKnowledgeBase() {
    fetch('/api/open-kb', {
        method: 'GET'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to open knowledge base');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showAlert('Opening knowledge base directory...', 'success');
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    })
    .catch(error => {
        console.error('Error opening knowledge base:', error);
        showAlert(`Error: ${error.message}`, 'error');
    });
}

// Open paper directory
function openPaperDirectory(paperId) {
    fetch(`/api/open/${paperId}`, {
        method: 'GET'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to open directory');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showAlert('Opening paper directory...', 'success');
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    })
    .catch(error => {
        console.error('Error opening directory:', error);
        showAlert(`Error: ${error.message}`, 'error');
    });
} 