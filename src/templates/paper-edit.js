// DOM Elements
const editModal = document.getElementById('edit-modal');
const editModalTitle = document.getElementById('edit-modal-title');
const editForm = document.getElementById('edit-form');
const editGithubUrl = document.getElementById('edit-github-url');
const editPaperId = document.getElementById('edit-paper-id');
const saveEditButton = document.getElementById('save-edit-button');
const closeModalButtons = document.querySelectorAll('.close-modal');

// Open edit modal
function openEditModal(paperId) {
    // Get paper details
    const paper = state.papers.find(p => p.id === paperId);
    if (!paper) {
        showAlert('Paper not found', 'error');
        return;
    }
    
    // Set modal title
    editModalTitle.textContent = `Edit: ${paper.title}`;
    
    // Set form values
    editGithubUrl.value = paper.githubUrl || '';
    editPaperId.value = paperId;
    
    // Show modal
    editModal.style.display = 'block';
}

// Close edit modal
function closeEditModal() {
    editModal.style.display = 'none';
    editForm.reset();
}

// Save paper edits
async function savePaperEdits(event) {
    event.preventDefault();
    
    const paperId = editPaperId.value;
    const githubUrl = editGithubUrl.value.trim();
    
    if (!paperId) {
        showAlert('Paper ID is required', 'error');
        return;
    }
    
    // Disable save button
    saveEditButton.disabled = true;
    saveEditButton.textContent = 'Saving...';
    
    try {
        const response = await fetch(`/api/papers/${paperId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                githubUrl
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update paper');
        }
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Paper updated successfully', 'success');
            
            // Update paper in state
            const paperIndex = state.papers.findIndex(p => p.id === paperId);
            if (paperIndex !== -1) {
                state.papers[paperIndex].githubUrl = githubUrl;
                
                // If GitHub repository was added, clone it
                if (githubUrl && !state.papers[paperIndex].localGithubPath) {
                    // Clone repository
                    const cloneResponse = await fetch(`/api/github/clone/${paperId}`, {
                        method: 'POST'
                    });
                    
                    if (cloneResponse.ok) {
                        const cloneData = await cloneResponse.json();
                        if (cloneData.success) {
                            state.papers[paperIndex].localGithubPath = cloneData.localGithubPath;
                            showAlert('GitHub repository cloned successfully', 'success');
                        }
                    }
                }
                
                // Update filtered papers
                const filteredIndex = state.filteredPapers.findIndex(p => p.id === paperId);
                if (filteredIndex !== -1) {
                    state.filteredPapers[filteredIndex].githubUrl = githubUrl;
                    if (state.papers[paperIndex].localGithubPath) {
                        state.filteredPapers[filteredIndex].localGithubPath = state.papers[paperIndex].localGithubPath;
                    }
                }
                
                // Re-render papers
                renderPapers();
            }
            
            // Close modal
            closeEditModal();
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    } catch (error) {
        console.error('Error updating paper:', error);
        showAlert(`Error: ${error.message}`, 'error');
    } finally {
        // Re-enable save button
        saveEditButton.disabled = false;
        saveEditButton.textContent = 'Save Changes';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Close modal when clicking close button or outside the modal
    closeModalButtons.forEach(button => {
        button.addEventListener('click', closeEditModal);
    });
    
    window.addEventListener('click', (event) => {
        if (event.target === editModal) {
            closeEditModal();
        }
    });
    
    // Handle form submission
    editForm.addEventListener('submit', savePaperEdits);
}); 