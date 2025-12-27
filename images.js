const API_BASE_URL = 'http://localhost:3000/api';

// Load images when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadImages();
});

async function loadImages() {
    const container = document.getElementById('galleryContainer');
    container.innerHTML = '<div class="loading">იტვირთება...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/images`);
        const data = await response.json();
        
        if (data.success && data.images && data.images.length > 0) {
            displayImages(data.images);
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <h2>სურათები ჯერ არ არის დამატებული</h2>
                    <p>გთხოვთ, მოგვიანებით სცადოთ</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading images:', error);
        container.innerHTML = `
            <div class="error">
                <h2>შეცდომა</h2>
                <p>სურათების ჩატვირთვა ვერ მოხერხდა. გთხოვთ, სცადოთ მოგვიანებით.</p>
            </div>
        `;
    }
}

function displayImages(images) {
    const container = document.getElementById('galleryContainer');
    
    if (images.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h2>სურათები ჯერ არ არის დამატებული</h2>
                <p>გთხოვთ, მოგვიანებით სცადოთ</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = images.map(image => `
        <a href="./image-detail.html?id=${image.id}" class="gallery-card">
            <img src="${image.image_url || ''}" 
                 alt="${escapeHtml(image.name || '')}" 
                 class="gallery-card-image"
                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22300%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3Eსურათი არ მოიძებნა%3C/text%3E%3C/svg%3E'">
            <div class="gallery-card-content">
                <h3 class="gallery-card-title">${escapeHtml(image.name || 'უსახელო')}</h3>
                ${image.description ? `<p class="gallery-card-description">${escapeHtml(image.description)}</p>` : ''}
                ${image.price ? `<div class="gallery-card-price">${parseFloat(image.price).toFixed(2)} ₾</div>` : ''}
                <div class="gallery-card-footer">
                    <span class="gallery-card-date">${formatDate(image.created_at)}</span>
                    <span style="color: #27ae60; font-weight: bold;">დეტალები →</span>
                </div>
            </div>
        </a>
    `).join('');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    
    // Georgian month names
    const months = [
        'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 
        'მაისი', 'ივნისი', 'ივლისი', 'აგვისტო', 
        'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month}, ${year}`;
}

