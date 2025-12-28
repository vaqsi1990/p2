# Connecting Google AI Studio with Supabase

This guide explains how Google AI Studio (Gemini) and Supabase work together in this project.

## Overview

In this project, **Supabase** stores images and **Google AI (Gemini)** analyzes them. They work together seamlessly:

1. **Images are uploaded to Supabase Storage** → Get public URLs
2. **Google AI fetches images from Supabase URLs** → Analyzes and generates content
3. **Generated content can be stored back in Supabase** (optional)

## Current Integration Flow

```
User Uploads Image
    ↓
Supabase Storage (stores image)
    ↓
Returns Public URL (e.g., https://xxx.supabase.co/storage/v1/object/public/book-uploads/image.jpg)
    ↓
Google AI (Gemini) fetches image from URL
    ↓
AI analyzes image and generates content
    ↓
Result returned to user
```

## Setup Instructions

### Step 1: Set Up Supabase

1. **Create a Supabase Project**
   - Go to [https://app.supabase.com/](https://app.supabase.com/)
   - Sign in and create a new project
   - Wait for project to initialize (2-3 minutes)

2. **Get Your Supabase Credentials**
   - Go to **Settings** → **API**
   - Copy your **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - Copy your **Service Role Key** (click "Reveal" to see it)
   - ⚠️ **Important**: Use the **service_role** key, not the anon key

3. **Create Storage Bucket**
   - Go to **Storage** in the left sidebar
   - Click **"New bucket"**
   - Name it: `book-uploads`
   - Set it to **Public**
   - Click **"Create bucket"**

4. **Add to `.env` file** (in `backend/` directory):
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 2: Set Up Google AI Studio

1. **Get API Key from Google AI Studio**
   - Go to [https://aistudio.google.com/](https://aistudio.google.com/)
   - Sign in with your Google account
   - Click **"Get API Key"** button (or go to **API Keys** section)
   - Click **"Create API Key"**
   - Select a Google Cloud project (or create a new one)
   - Copy the API key (starts with `AIza...`)

2. **Enable Generative AI API** (if needed)
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project
   - Go to **APIs & Services** → **Library**
   - Search for "Generative Language API"
   - Click **Enable**

3. **Add to `.env` file**:
```env
GOOGLE_API_KEY=AIzaSyC...
```

### Step 3: Complete `.env` File

Your complete `backend/.env` file should look like:

```env
PORT=3000
NODE_ENV=development

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google AI (Gemini) Configuration
GOOGLE_API_KEY=AIzaSyC...
```

## How They Work Together

### Example 1: Image Analysis Flow

```javascript
// 1. Image uploaded to Supabase
const uploadResult = await uploadToSupabase(file);
// Returns: { url: "https://xxx.supabase.co/.../image.jpg" }

// 2. Google AI fetches and analyzes image from Supabase URL
const result = await analyzeAndGenerate(uploadResult.url);
// Google AI downloads image from Supabase URL and analyzes it
```

**Code Location**: `backend/config/googleai.js` - `analyzeAndGenerate()` function

### Example 2: Fairy Tale Character Generation

```javascript
// 1. Multiple images uploaded to Supabase
const imageUrls = [
  "https://xxx.supabase.co/.../child1.jpg",
  "https://xxx.supabase.co/.../child2.jpg"
];

// 2. Google AI processes each Supabase URL
const characters = await generateFairyTaleCharacters(imageUrls);
// For each URL, Google AI:
// - Fetches image from Supabase
// - Analyzes the image
// - Generates a fairy tale character description
```

**Code Location**: `backend/config/googleai.js` - `generateFairyTaleCharacters()` function

## Testing the Connection

### Test 1: Test All Connections

Visit in your browser:
```
http://localhost:3000/api/test/connections
```

This will test:
- ✅ Supabase connection
- ✅ Google AI connection
- ✅ Database connection

### Test 2: Test Supabase Only

```bash
curl http://localhost:3000/api/test/connections
```

Look for the `supabase` section in the response.

### Test 3: Test Google AI Only

```bash
curl http://localhost:3000/api/test/google-ai
```

### Test 4: Upload and Process Image

1. Upload an image via the upload endpoint
2. The image is stored in Supabase
3. Use the Supabase URL with Google AI endpoints
4. Google AI will automatically fetch the image from Supabase

## Architecture Diagram

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Upload Image
       ↓
┌─────────────────┐
│  Express Server │
│   (Backend)     │
└──────┬──────────┘
       │
       ├──────────────┐
       │              │
       ↓              ↓
┌─────────────┐  ┌──────────────┐
│  Supabase   │  │  Google AI   │
│  Storage    │  │  (Gemini)    │
└──────┬──────┘  └──────┬───────┘
       │                │
       │ 2. Store       │ 3. Fetch from
       │    Image       │    Supabase URL
       │                │
       │                │ 4. Analyze
       │                │    & Generate
       │                │
       └────────┬───────┘
                │
                ↓
         ┌──────────────┐
         │   Response    │
         │  to Client    │
         └──────────────┘
```

## Key Points

1. **No Direct Connection**: Google AI and Supabase don't connect directly. Your backend server acts as the bridge.

2. **Public URLs Required**: Supabase images must be publicly accessible (or use signed URLs) for Google AI to fetch them.

3. **Image URLs**: Google AI functions accept Supabase Storage URLs directly - they automatically fetch the images.

4. **Storage Bucket**: Make sure your Supabase bucket is set to **Public** so Google AI can access the images.

## Troubleshooting

### Error: "Failed to fetch image"
- **Cause**: Image URL is not accessible
- **Solution**: 
  - Check if Supabase bucket is public
  - Verify the URL is correct
  - Check Supabase storage policies

### Error: "GOOGLE_API_KEY not set"
- **Cause**: API key missing in `.env`
- **Solution**: Add `GOOGLE_API_KEY=your-key` to `backend/.env`

### Error: "Supabase configuration missing"
- **Cause**: Supabase credentials missing
- **Solution**: Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `backend/.env`

### Error: "API quota exceeded"
- **Cause**: Google AI API quota limit reached
- **Solution**: 
  - Wait for quota reset
  - Upgrade your Google Cloud plan
  - Check quota limits in Google Cloud Console

## Advanced: Storing AI Results in Supabase

You can also store AI-generated content back in Supabase:

```javascript
// 1. Generate content with Google AI
const aiResult = await generateFairyTaleCharacters(imageUrls);

// 2. Store results in Supabase (if needed)
const supabase = getSupabaseClient();
await supabase
  .from('ai_results')
  .insert({
    image_urls: imageUrls,
    generated_content: aiResult
  });
```

## Security Notes

1. **Never expose Service Role Key**: The `SUPABASE_SERVICE_ROLE_KEY` should only be used in backend code, never in frontend.

2. **API Key Security**: Keep your `GOOGLE_API_KEY` secret. Add `.env` to `.gitignore`.

3. **Public Buckets**: If using public buckets, be aware that anyone with the URL can access images.

4. **Rate Limiting**: Google AI has rate limits. The code includes retry logic with exponential backoff.

## Resources

- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)
- **Google AI Studio**: [https://aistudio.google.com/](https://aistudio.google.com/)
- **Gemini API Docs**: [https://ai.google.dev/docs](https://ai.google.dev/docs)
- **Supabase Storage**: [https://supabase.com/docs/guides/storage](https://supabase.com/docs/guides/storage)

## Summary

✅ **Supabase** = Storage for images (provides public URLs)
✅ **Google AI** = AI analysis and generation (fetches images from Supabase URLs)
✅ **Your Backend** = Bridge between them

They work together automatically - just upload images to Supabase and pass the URLs to Google AI functions!

