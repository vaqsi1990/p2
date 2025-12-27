
# Supabase Setup Guide

Supabase is used in this project to store uploaded images. Here's what you need:

## What You Need from Supabase

### 1. **Project URL** (`SUPABASE_URL`)
- This is your Supabase project's base URL
- Format: `https://your-project-id.supabase.co`

### 2. **Service Role Key** (`SUPABASE_SERVICE_ROLE_KEY`)
- ⚠️ **Important**: You need the **Service Role Key**, NOT the anon key
- This key has admin privileges and can bypass Row Level Security (RLS)
- Keep this key secret - never expose it in frontend code!

### 3. **Storage Bucket** (`book-uploads`)
- A storage bucket where images will be uploaded
- Must be named exactly: `book-uploads`
- Should be set to **public** (or configure policies as needed)

---

## Step-by-Step Setup

### Step 1: Create/Login to Supabase

1. Go to [https://app.supabase.com/](https://app.supabase.com/)
2. Sign in with your GitHub account (or create an account)
3. Click **"New Project"** (or select existing project)

### Step 2: Get Your Project URL

1. In your Supabase project dashboard
2. Go to **Settings** → **API**
3. Find **"Project URL"**
4. Copy it - it looks like: `https://abcdefghijklmnop.supabase.co`

### Step 3: Get Your Service Role Key

1. Still in **Settings** → **API**
2. Find **"service_role"** key (under "Project API keys")
3. ⚠️ **Click "Reveal"** to show the key
4. Copy the entire key (it's very long, starts with `eyJ...`)

**⚠️ Security Warning:**
- The **service_role** key has admin access
- Never commit it to Git
- Never use it in frontend/browser code
- Only use it in backend/server code

### Step 4: Create Storage Bucket

1. In Supabase dashboard, go to **Storage** (left sidebar)
2. Click **"New bucket"**
3. Name it: `book-uploads` (exactly this name)
4. Set it to **Public** (or configure policies)
5. Click **"Create bucket"**

### Step 5: Configure Bucket Policies (Optional but Recommended)

1. Click on the `book-uploads` bucket
2. Go to **"Policies"** tab
3. Add a policy for public read access:
   - Policy name: `Public Read Access`
   - Allowed operation: `SELECT`
   - Target roles: `public`
   - Policy definition: `true` (allow all)

### Step 6: Add to Your .env File

Add these two lines to your `backend/.env` file:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1pZCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.your-actual-key-here
```

**Replace:**
- `https://your-project-id.supabase.co` with your actual project URL
- `eyJ...` with your actual service role key

---

## Testing Your Setup

After adding the credentials, test the connection:

1. Restart your server: `npm run dev`
2. Visit: `http://localhost:3000/api/test/connections`
3. Check the `supabase` section - it should show `status: "ok"`

---

## What Supabase Does in This Project

- **Stores uploaded images** from `/upload.html`
- **Provides public URLs** for images so they can be accessed by the AI
- **Handles file management** (upload, delete, etc.)

---

## Troubleshooting

### Error: "Supabase configuration missing"
- Make sure both `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are in your `.env` file
- Check for typos in variable names
- Restart your server after adding variables

### Error: "Bucket not found"
- Make sure the bucket is named exactly `book-uploads`
- Check that the bucket exists in your Supabase Storage

### Error: "Permission denied"
- Make sure you're using the **service_role** key, not the anon key
- Check bucket policies if you set the bucket to private

### Images not accessible
- Make sure the bucket is set to **Public**
- Or configure proper storage policies for public read access

---

## Free Tier Limits

Supabase free tier includes:
- 500 MB storage
- 2 GB bandwidth/month
- Unlimited API requests

For this project (book images), the free tier should be sufficient for testing and small projects.

---

## Need Help?

- Supabase Docs: [https://supabase.com/docs](https://supabase.com/docs)
- Supabase Storage Docs: [https://supabase.com/docs/guides/storage](https://supabase.com/docs/guides/storage)
- Community: [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)

