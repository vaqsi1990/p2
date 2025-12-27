# How to Test Your Google AI API Connection

This guide shows you multiple ways to verify that your Google AI API is working correctly.

## Method 1: Quick Test Script (Recommended)

Run the standalone test script:

```bash
cd backend
node test-google-ai.js
```

This will:
- ✅ Check if your API key is set
- ✅ Find a working model
- ✅ Test text generation
- ✅ Show detailed error messages if something fails

**Expected Output (Success):**
```
🔍 Testing Google AI API Connection...

✅ API Key found in environment

📋 Test 1: Finding a working model...
✅ Found working model: gemini-1.5-flash
   Tested 7 models

📝 Test 2: Generating text with AI...
✅ Text generation successful!
   Model used: gemini-1.5-flash
   Response: Hello! I am working correctly.

🔧 Test 3: Direct model access...
✅ Direct model access successful!
   Response: Test...

🎉 All tests passed! Your Google AI API is working correctly!
```

## Method 2: Test via Browser/API Endpoints

### Option A: Quick Google AI Test
Open in your browser or use curl:
```
http://localhost:3000/api/test/google-ai
```

**Using curl:**
```bash
curl http://localhost:3000/api/test/google-ai
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Google AI is working correctly!",
  "details": {
    "model": "gemini-1.5-flash",
    "apiKeySet": true,
    "testResponse": "Hello! Google AI is working correctly.",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### Option B: Full Connection Test
Test all connections (database, Google AI, Supabase):
```
http://localhost:3000/api/test/connections
```

**Using curl:**
```bash
curl http://localhost:3000/api/test/connections
```

This will show the status of all your services, including Google AI.

### Option C: List Available Models
See what models are available:
```
http://localhost:3000/api/test/models
```

## Method 3: Test via API Endpoint (POST Request)

Test the actual AI generation endpoint:

**Using curl:**
```bash
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Say hello if you can hear me"}'
```

**Using JavaScript (fetch):**
```javascript
fetch('http://localhost:3000/api/ai/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'Say hello if you can hear me'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

## Common Issues and Solutions

### ❌ Error: "GOOGLE_API_KEY not set"
**Solution:**
1. Create a `.env` file in the `backend` directory
2. Add: `GOOGLE_API_KEY=your-api-key-here`
3. Get your API key from: https://aistudio.google.com/

### ❌ Error: "No working model found"
**Possible causes:**
- API key is invalid or expired
- Generative AI API is not enabled for your project
- API key doesn't have proper permissions

**Solution:**
1. Go to https://aistudio.google.com/
2. Check your API key is valid
3. Make sure Generative AI API is enabled
4. Try creating a new API key

### ❌ Error: "API key format is invalid"
**Solution:**
- Make sure there are no extra spaces in your `.env` file
- Format should be: `GOOGLE_API_KEY=AIza...` (no quotes needed)
- Don't include any spaces before or after the `=`

### ❌ Error: "Model not found" or "Model unavailable"
**Solution:**
- The code will automatically try different models
- If all fail, check Google AI Studio for available models
- You can manually specify a model in your requests

## Verification Checklist

- [ ] `.env` file exists in `backend/` directory
- [ ] `GOOGLE_API_KEY` is set in `.env`
- [ ] API key is valid (get from https://aistudio.google.com/)
- [ ] Server is running (`npm run dev`)
- [ ] Test script passes (`node test-google-ai.js`)
- [ ] Browser test works (`http://localhost:3000/api/test/google-ai`)

## Next Steps

Once your API is working:
- Use `/api/ai/generate` for text generation
- Use `/api/ai/chat` for conversations
- Use `/api/ai/complete` for text completion

For more details, see `backend/README.md`

