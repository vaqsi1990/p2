// Password protection
const ADMIN_PASSWORD = 'admin123'; // Change this to your desired password

const loginOverlay = document.getElementById('loginOverlay');
const adminContent = document.getElementById('adminContent');
const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('passwordInput');
const errorMessage = document.getElementById('errorMessage');

// Check if user is already authenticated
function checkAuth() {
    const isAuthenticated = sessionStorage.getItem('adminAuthenticated');
    if (isAuthenticated === 'true') {
        showAdminPanel();
    }
}

// Show admin panel
function showAdminPanel() {
    loginOverlay.classList.add('hidden');
    adminContent.classList.add('visible');
    document.body.style.display = 'flex';
}

// Handle login form submission
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const password = passwordInput.value;
    
    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminAuthenticated', 'true');
        errorMessage.classList.remove('show');
        passwordInput.value = '';
        showAdminPanel();
    } else {
        errorMessage.classList.add('show');
        passwordInput.value = '';
        passwordInput.focus();
    }
});

// Check authentication on page load
checkAuth();

// Logout functionality
function logout() {
    sessionStorage.removeItem('adminAuthenticated');
    adminContent.classList.remove('visible');
    loginOverlay.classList.remove('hidden');
    document.body.style.display = 'block';
    passwordInput.focus();
}

// Add logout button event listeners
const logoutBtn = document.getElementById('logoutBtn');
const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');

function handleLogout(e) {
    e.preventDefault();
    if (confirm('Are you sure you want to logout?')) {
        logout();
    }
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
}

if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener('click', handleLogout);
}

// Navigation functionality
document.querySelectorAll('.sidebar-menu a[data-section]').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Remove active class from all links
        document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
        this.classList.add('active');
        
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        const sectionId = this.getAttribute('data-section');
        document.getElementById(sectionId).classList.add('active');
        
        // Update page title
        const titles = {
            'dashboard': 'Dashboard',
            'books': 'Book Management',
            'images': 'Image Management'
        };
        document.getElementById('page-title').textContent = titles[sectionId] || 'Admin Panel';
        
        // Load images when images section is opened
        if (sectionId === 'images') {
            loadImages();
        }
    });
});

// ===== Image Management Functionality =====
const API_BASE_URL = 'http://localhost:3000/api';

let currentEditingImageId = null;
let allImages = [];

// Load all images from API
async function loadImages() {
    const tbody = document.getElementById('imagesTableBody');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">Loading images...</td></tr>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/images`);
        const data = await response.json();
        
        if (data.success) {
            allImages = data.images || [];
            displayImages(allImages);
        } else {
            throw new Error(data.error || 'Failed to load images');
        }
    } catch (error) {
        console.error('Error loading images:', error);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: #d32f2f;">Error loading images: ${error.message}</td></tr>`;
    }
}

// Display images in table
function displayImages(images) {
    const tbody = document.getElementById('imagesTableBody');
    
    if (images.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No images found</td></tr>';
        return;
    }
    
    tbody.innerHTML = images.map(image => `
        <tr>
            <td>${image.id}</td>
            <td>
                <img src="${image.image_url || ''}" alt="${image.name || ''}" 
                     style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;"
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22%3E%3Crect fill=%22%23ddd%22 width=%2260%22 height=%2260%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3ENo Image%3C/text%3E%3C/svg%3E'">
            </td>
            <td>${escapeHtml(image.name || 'N/A')}</td>
            <td>${escapeHtml(image.description || 'N/A')}</td>
            <td>${image.price ? `${parseFloat(image.price).toFixed(2)} ₾` : 'N/A'}</td>
            <td>${formatDate(image.created_at)}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="editImage(${image.id})" style="margin-right: 5px;">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteImage(${image.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Search images
function searchImages() {
    const searchTerm = document.getElementById('imageSearchInput').value.toLowerCase().trim();
    
    if (!searchTerm) {
        displayImages(allImages);
        return;
    }
    
    const filtered = allImages.filter(image => 
        (image.name && image.name.toLowerCase().includes(searchTerm)) ||
        (image.description && image.description.toLowerCase().includes(searchTerm)) ||
        (image.id && image.id.toString().includes(searchTerm))
    );
    
    displayImages(filtered);
}

// Open modal for adding new image
function openAddImageModal() {
    currentEditingImageId = null;
    document.getElementById('modalTitle').textContent = 'Add New Image';
    document.getElementById('imageForm').reset();
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('imageFile').required = true;
    document.getElementById('imageModal').classList.add('show');
}

// Edit image
async function editImage(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/images/${id}`);
        const data = await response.json();
        
        if (data.success) {
            const image = data.image;
            currentEditingImageId = id;
            
            document.getElementById('modalTitle').textContent = 'Edit Image';
            document.getElementById('imageName').value = image.name || '';
            document.getElementById('imageDescription').value = image.description || '';
            document.getElementById('imagePrice').value = image.price || '';
            
            // Show preview of existing image
            if (image.image_url) {
                document.getElementById('imagePreview').innerHTML = `
                    <img src="${image.image_url}" alt="Preview" 
                         style="max-width: 200px; max-height: 200px; border-radius: 4px; margin-top: 10px;">
                    <p style="margin-top: 5px; font-size: 12px; color: #666;">Current image</p>
                `;
            }
            
            document.getElementById('imageFile').required = false; // Not required for edit
            document.getElementById('imageModal').classList.add('show');
        } else {
            alert('Error loading image: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error loading image:', error);
        alert('Error loading image: ' + error.message);
    }
}

// Delete image
async function deleteImage(id) {
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/images/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Image deleted successfully!');
            loadImages(); // Reload images
        } else {
            throw new Error(data.error || 'Failed to delete image');
        }
    } catch (error) {
        console.error('Error deleting image:', error);
        alert('Error deleting image: ' + error.message);
    }
}

// Handle image form submission
document.getElementById('imageForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const saveBtn = document.getElementById('saveImageBtn');
    const originalText = saveBtn.textContent;
    
    // Disable button during submission
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    try {
        const url = currentEditingImageId 
            ? `${API_BASE_URL}/images/${currentEditingImageId}`
            : `${API_BASE_URL}/images`;
        
        const method = currentEditingImageId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(currentEditingImageId ? 'Image updated successfully!' : 'Image added successfully!');
            closeImageModal();
            loadImages(); // Reload images
        } else {
            throw new Error(data.error || 'Failed to save image');
        }
    } catch (error) {
        console.error('Error saving image:', error);
        alert('Error saving image: ' + error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
});

// Close modal
function closeImageModal() {
    document.getElementById('imageModal').classList.remove('show');
    currentEditingImageId = null;
    document.getElementById('imageForm').reset();
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('imageFile').required = true; // Reset required for new images
}

// Image preview when file is selected
document.getElementById('imageFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('imagePreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Preview" 
                     style="max-width: 200px; max-height: 200px; border-radius: 4px; margin-top: 10px;">
            `;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
});

// Modal close handlers
document.getElementById('closeModal').addEventListener('click', closeImageModal);
document.getElementById('cancelBtn').addEventListener('click', closeImageModal);

// Close modal when clicking outside
document.getElementById('imageModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeImageModal();
    }
});

// Event listeners for image management
document.getElementById('addImageBtn').addEventListener('click', openAddImageModal);
document.getElementById('imageSearchBtn').addEventListener('click', searchImages);

// Search on Enter key
document.getElementById('imageSearchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchImages();
    }
});

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('ka-GE', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Make functions globally available for onclick handlers
window.editImage = editImage;
window.deleteImage = deleteImage;

