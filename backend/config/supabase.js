const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Lazy initialization of Supabase client
let supabase = null;

const getSupabaseClient = () => {
    if (!supabase) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error(
                'Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.'
            );
        }
        
        supabase = createClient(supabaseUrl, supabaseKey);
    }
    return supabase;
};

// Ensure bucket exists, create if it doesn't
const ensureBucketExists = async (bucketName = 'book-uploads') => {
    try {
        const client = getSupabaseClient();
        
        // Check if bucket exists
        const { data: buckets, error: listError } = await client.storage.listBuckets();
        
        if (listError) {
            throw listError;
        }
        
        const bucketExists = buckets.some(bucket => bucket.name === bucketName);
        
        if (!bucketExists) {
            console.log(`Creating bucket "${bucketName}"...`);
            
            // Create the bucket
            const { data, error: createError } = await client.storage.createBucket(bucketName, {
                public: true, // Make it public
                fileSizeLimit: 10485760, // 10MB
                allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
            });
            
            if (createError) {
                // If bucket already exists (race condition), that's fine
                if (createError.message && createError.message.includes('already exists')) {
                    console.log(`Bucket "${bucketName}" already exists`);
                    return true;
                }
                throw createError;
            }
            
            console.log(`✅ Bucket "${bucketName}" created successfully!`);
            return true;
        }
        
        return true;
    } catch (error) {
        console.error('Error ensuring bucket exists:', error);
        throw error;
    }
};

// Upload file to Supabase Storage
const uploadToSupabase = async (file, folder = 'book-images') => {
    try {
        // Ensure bucket exists before uploading
        await ensureBucketExists('book-uploads');
        
        const client = getSupabaseClient();
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        // Upload file buffer to Supabase Storage
        const { data, error } = await client.storage
            .from('book-uploads')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
                cacheControl: '3600'
            });

        if (error) {
            console.error('Supabase upload error:', error);
            throw error;
        }

        // Get public URL
        const { data: urlData } = client.storage
            .from('book-uploads')
            .getPublicUrl(filePath);

        return {
            fileName: fileName,
            filePath: filePath,
            url: urlData.publicUrl,
            size: file.size,
            mimetype: file.mimetype,
            originalName: file.originalname
        };
    } catch (error) {
        console.error('Supabase upload error:', error);
        throw error;
    }
};

// Delete file from Supabase Storage
const deleteFromSupabase = async (filePath) => {
    try {
        const client = getSupabaseClient();
        const { error } = await client.storage
            .from('book-uploads')
            .remove([filePath]);

        if (error) {
            throw error;
        }

        return true;
    } catch (error) {
        console.error('Supabase delete error:', error);
        throw error;
    }
};

module.exports = {
    getSupabaseClient,
    uploadToSupabase,
    deleteFromSupabase,
    ensureBucketExists
};

