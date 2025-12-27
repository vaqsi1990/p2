const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Helper function to sleep/delay
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry function with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Check if it's a rate limit error (429)
      const isRateLimit = error.message && (
        error.message.includes('429') || 
        error.message.includes('quota') || 
        error.message.includes('rate limit') ||
        error.message.includes('Too Many Requests')
      );

      if (isRateLimit && attempt < maxRetries - 1) {
        // Extract retry delay from error message if available
        let delay = initialDelay * Math.pow(2, attempt);
        const retryMatch = error.message.match(/retry.*?(\d+)\s*s/i);
        if (retryMatch) {
          delay = parseInt(retryMatch[1]) * 1000 + 1000; // Add 1 second buffer
        }
        
        console.log(`Rate limit hit. Waiting ${delay/1000}s before retry ${attempt + 1}/${maxRetries}...`);
        await sleep(delay);
        continue;
      }
      
      throw error;
    }
  }
}

async function analyzeAndGenerate(imageUrl) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    console.log(`Fetching image from: ${imageUrl}`);
    // Fetch image → base64
    const res = await fetch(imageUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    console.log(`Image fetched, size: ${buffer.length} bytes`);

    console.log('Sending image to Gemini AI for analysis...');
    
    // Use retry logic for API calls
    const result = await retryWithBackoff(async () => {
      return await model.generateContent([
        `
Describe the child in the image for a fairy tale illustration.
Cartoon style, soft colors, storybook illustration.
Do NOT include name or story.
`,
        {
          inlineData: {
            data: buffer.toString('base64'),
            mimeType: 'image/jpeg'
          }
        }
      ]);
    });

    const description = result.response.text().trim();
    console.log(`AI description received: ${description.substring(0, 100)}...`);

    // Generate illustration (NO REAL PHOTO)
    const imagePrompt = `
storybook illustration of a fantasy character,
inspired by: ${description},
cute cartoon style, pastel colors,
hand drawn, NOT realistic, safe for children
`;

    const imageUrlGenerated =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=512&height=512&nologo=true`;

    console.log(`Generated image URL: ${imageUrlGenerated}`);

    return {
      success: true,
      generatedImageUrl: imageUrlGenerated
    };
  } catch (error) {
    console.error('Error in analyzeAndGenerate:', error);
    throw error;
  }
}

async function generateFairyTaleCharacters(imageUrls, options = {}) {
  const characters = [];
  const delayBetweenRequests = 2000; // 2 seconds delay between requests to avoid rate limits

  console.log(`Generating characters for ${imageUrls.length} images...`);

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    try {
      console.log(`Processing image ${i + 1}/${imageUrls.length}: ${url}`);
      
      // Add delay between requests (except for the first one)
      if (i > 0) {
        console.log(`Waiting ${delayBetweenRequests/1000}s before next request to avoid rate limits...`);
        await sleep(delayBetweenRequests);
      }
      
      const result = await analyzeAndGenerate(url);
      characters.push(result);
      console.log(`Successfully generated character ${i + 1}`);
    } catch (e) {
      console.error(`Failed to generate character ${i + 1}:`, e.message);
      
      // Check if it's a quota exceeded error
      const isQuotaExceeded = e.message && (
        e.message.includes('quota') || 
        e.message.includes('Quota exceeded') ||
        e.message.includes('429')
      );
      
      characters.push({ 
        success: false, 
        error: isQuotaExceeded 
          ? 'API quota exceeded. Please try again later or upgrade your plan.'
          : e.message || 'Unknown error',
        imageUrl: url
      });
    }
  }

  console.log(`Generated ${characters.filter(c => c.success).length}/${imageUrls.length} characters successfully`);

  return {
    success: true,
    characters
  };
}

// Replace child in template image with uploaded child photo
async function replaceChildInTemplate(childImageUrl, templateImageUrl, options = {}) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    console.log(`Fetching child image from: ${childImageUrl}`);
    console.log(`Fetching template image from: ${templateImageUrl}`);

    // Fetch both images
    const childRes = await fetch(childImageUrl);
    if (!childRes.ok) {
      throw new Error(`Failed to fetch child image: ${childRes.status} ${childRes.statusText}`);
    }
    const childBuffer = Buffer.from(await childRes.arrayBuffer());
    const childMimeType = childRes.headers.get('content-type') || 'image/jpeg';

    const templateRes = await fetch(templateImageUrl);
    if (!templateRes.ok) {
      throw new Error(`Failed to fetch template image: ${templateRes.status} ${templateRes.statusText}`);
    }
    const templateBuffer = Buffer.from(await templateRes.arrayBuffer());
    const templateMimeType = templateRes.headers.get('content-type') || 'image/jpeg';

    console.log('Analyzing images with Gemini AI...');

    // Use retry logic for API calls
    const result = await retryWithBackoff(async () => {
      return await model.generateContent([
        `You are analyzing two images:
1. A template illustration of a children's birthday book cover showing a baby boy in a forest scene with animals (bear, squirrel, fox, rabbit) and Georgian text "სანის პირველი დაბადების დღე" at the top.
2. A real photo of a child.

Your task:
- Analyze the template image: describe the scene, composition, colors, style, position of the child, background elements, animals, and text placement.
- Analyze the child photo: describe the child's appearance, facial features, hair color, clothing, pose, and expression.
- Create a detailed prompt for generating a new image that places the child from the photo into the template scene, maintaining the same artistic style, composition, and all elements (animals, forest, text) exactly as in the template, but with the new child replacing the original child in the same position and pose.

The output should be a detailed image generation prompt that will recreate the entire scene with the new child seamlessly integrated.`,
        {
          inlineData: {
            data: templateBuffer.toString('base64'),
            mimeType: templateMimeType
          }
        },
        {
          inlineData: {
            data: childBuffer.toString('base64'),
            mimeType: childMimeType
          }
        }
      ]);
    });

    const prompt = result.response.text().trim();
    console.log(`Generated prompt: ${prompt.substring(0, 200)}...`);

    // Generate the final image using Pollinations
    const imageUrlGenerated =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&enhance=true`;

    console.log(`Generated image URL: ${imageUrlGenerated}`);

    return {
      success: true,
      generatedImageUrl: imageUrlGenerated,
      prompt: prompt
    };
  } catch (error) {
    console.error('Error in replaceChildInTemplate:', error);
    throw error;
  }
}

module.exports = { generateFairyTaleCharacters, replaceChildInTemplate };
