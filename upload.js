// ===== DOM =====
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewSection = document.getElementById('previewSection');
const previewGrid = document.getElementById('previewGrid');
const generateBtn = document.getElementById('generateCharactersBtn');
const charactersSection = document.getElementById('charactersSection');
const charactersGrid = document.getElementById('charactersGrid');

// Child replacement DOM elements (removed - functionality no longer needed)

let uploadedFiles = [];
let uploadedImageUrls = [];
let templateImageUrl = null;
let backgroundImageUrl = null; // Background image from image_id parameter

const API_BASE_URL = 'http://localhost:3000/api';

// Get image_id from URL
const urlParams = new URLSearchParams(window.location.search);
const templateImageId = urlParams.get('image_id');

// Load template image automatically if image_id is provided
if (templateImageId) {
  loadTemplateImage(templateImageId);
}

async function loadTemplateImage(imageId) {
  try {
    const response = await fetch(`${API_BASE_URL}/images/${imageId}`);
    const data = await response.json();
    
    if (data.success && data.image && data.image.image_url) {
      templateImageUrl = data.image.image_url;
      // Use this image as background for Google AI
      backgroundImageUrl = data.image.image_url;
      
      console.log('Template image loaded:', templateImageUrl);
      console.log('Background image set for Google AI:', backgroundImageUrl);
      
      // Show background preview in UI
      showBackgroundPreview(data.image);
      
      // Show notification that background will be used
      showBackgroundNotification(data.image.name || 'სურათი');
    } else {
      throw new Error('სურათი ვერ მოიძებნა');
    }
  } catch (error) {
    console.error('Error loading template image:', error);
    alert('შეცდომა ტემპლეიტის სურათის ჩატვირთვისას: ' + error.message);
  }
}

function showBackgroundPreview(image) {
  const previewSection = document.getElementById('selectedBackgroundPreview');
  const previewImg = document.getElementById('selectedBackgroundImg');
  const previewName = document.getElementById('selectedBackgroundName');
  
  if (previewSection && previewImg && previewName) {
    previewImg.src = image.image_url || '';
    previewImg.alt = image.name || 'ბექგრაუნდი';
    previewName.textContent = image.name || 'სურათი';
    previewSection.style.display = 'block';
  }
}

function showBackgroundNotification(imageName) {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #9b59b6;
    color: white;
    padding: 15px 20px;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 1000;
    max-width: 300px;
    font-size: 14px;
  `;
  notification.innerHTML = `
    <strong>✓ ბექგრაუნდი ავტომატურად აირჩია</strong><br>
    <small>${imageName} გამოყენებული იქნება ბექგრაუნდად</small>
  `;
  document.body.appendChild(notification);
  
  // Remove after 5 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s';
    setTimeout(() => notification.remove(), 500);
  }, 5000);
}

// ===== Upload handling =====
fileInput.addEventListener('change', e => handleFiles([...e.target.files]));

function handleFiles(files) {
  files.forEach(file => {
    if (!file.type.startsWith('image/')) return;
    uploadedFiles.push(file);

    const reader = new FileReader();
    reader.onload = e => {
      const div = document.createElement('div');
      div.className = 'preview-item';
      div.innerHTML = `<img src="${e.target.result}">`;
      previewGrid.appendChild(div);
    };
    reader.readAsDataURL(file);
  });

  if (uploadedFiles.length) {
    previewSection.style.display = 'block';
    generateBtn.style.display = 'inline-block';
  }
}

// ===== Generate Fairy Tale Characters =====
generateBtn.addEventListener('click', async () => {
  if (!uploadedFiles.length) return;

  generateBtn.disabled = true;
  generateBtn.textContent = 'მუშავდება...';

  // Hide real photos immediately
  previewSection.style.display = 'none';

  charactersSection.style.display = 'block';
  charactersGrid.innerHTML = `<p>გმირების შექმნა მიმდინარეობს...</p>`;

  try {
    // Upload images
    const formData = new FormData();
    uploadedFiles.forEach(f => formData.append('images', f));

    const uploadRes = await fetch('http://localhost:3000/api/upload/multiple', {
      method: 'POST',
      body: formData
    });

    const uploadData = await uploadRes.json();
    uploadedImageUrls = uploadData.files.map(f => f.url);

    // Prepare request body with background image if available
    const requestBody = { imageUrls: uploadedImageUrls };
    if (backgroundImageUrl) {
      requestBody.backgroundImageUrl = backgroundImageUrl;
      console.log('Using background image from image_id:', backgroundImageUrl);
    }

    // Generate characters
    const aiRes = await fetch('http://localhost:3000/api/ai/fairy-tale-characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!aiRes.ok) {
      const errorData = await aiRes.json();
      throw new Error(errorData.error || `Server error: ${aiRes.status}`);
    }

    const aiData = await aiRes.json();

    if (!aiData.success) {
      throw new Error(aiData.error || 'Failed to generate characters');
    }

    charactersGrid.innerHTML = '';

    aiData.data.characters.forEach((char, i) => {
      if (!char.success || !char.generatedImageUrl) {
        const errorMsg = char.error || 'უცნობი შეცდომა';
        charactersGrid.innerHTML += `<p style="color:red">გმირი ${i + 1} ვერ შეიქმნა: ${errorMsg}</p>`;
        console.error(`Character ${i + 1} failed:`, char);
        return;
      }

      const card = document.createElement('div');
      card.className = 'character-card';

      const img = document.createElement('img');
      img.src = char.generatedImageUrl;
      img.alt = `ზღაპრის გმირი ${i + 1}`;

      img.onerror = () => {
        card.innerHTML = `<p style="color:red">სურათი ვერ ჩაიტვირთა</p>`;
      };

      card.appendChild(img);
      charactersGrid.appendChild(card);
    });


  } catch (err) {
    console.error('Error generating characters:', err);
    charactersGrid.innerHTML = `<p style="color:red">შეცდომა: ${err.message}</p>`;
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = 'ზღაპრის გმირების შექმნა';
  }
});

