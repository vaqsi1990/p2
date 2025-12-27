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
      
      console.log('Template image loaded:', templateImageUrl);
    } else {
      throw new Error('სურათი ვერ მოიძებნა');
    }
  } catch (error) {
    console.error('Error loading template image:', error);
    alert('შეცდომა ტემპლეიტის სურათის ჩატვირთვისას: ' + error.message);
  }
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

    // Generate characters
    const aiRes = await fetch('http://localhost:3000/api/ai/fairy-tale-characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrls: uploadedImageUrls })
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

