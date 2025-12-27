const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { getGoogleAIModel } = require('../config/googleai');
const { getSupabaseClient, ensureBucketExists } = require('../config/supabase');

// ===============================
// TEST ALL CONNECTIONS
// ===============================
router.get('/connections', async (req, res) => {
  const results = {
    server: { status: 'ok', message: 'Server is running' },
    database: { status: 'unknown', message: 'Not tested' },
    googleAI: { status: 'unknown', message: 'Not tested' },
    supabase: { status: 'unknown', message: 'Not tested' },
    environment: { status: 'unknown', message: 'Not tested' }
  };

  // ===============================
  // DATABASE TEST (Neon / Postgres)
  // ===============================
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not set');
    }

    const testQuery = await pool.query(
      'SELECT NOW() as current_time, version() as version'
    );

    results.database = {
      status: 'ok',
      message: 'Database connection successful',
      details: {
        currentTime: testQuery.rows[0].current_time,
        version: testQuery.rows[0].version.split(' ').slice(0, 2).join(' ')
      }
    };
  } catch (error) {
    results.database = {
      status: 'error',
      message: error.message,
      error: error.code || 'DB_CONNECTION_FAILED'
    };
  }

  // ===============================
  // GOOGLE AI TEST (Gemini)
  // ===============================
  try {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY not set');
    }

    const { findWorkingModel, listModels } = require('../config/googleai');
    
    // Try to find a working model
    const workingModel = await findWorkingModel();
    
    if (!workingModel.success) {
      // Try to get available models from API
      let availableModels = null;
      try {
        const modelsList = await listModels();
        availableModels = modelsList.models || [];
      } catch (listError) {
        console.log('Could not list models:', listError.message);
      }
      
      const errorDetails = {
        message: 'Could not find a working model',
        tested: workingModel.tested || 0,
        errors: workingModel.errors || [],
        suggestion: 'Check your API key at https://aistudio.google.com/ and ensure Generative AI API is enabled'
      };
      
      if (availableModels && availableModels.length > 0) {
        errorDetails.availableModels = availableModels.map(m => m.name || m).slice(0, 10);
        errorDetails.note = `Found ${availableModels.length} models in API, but none worked with generateContent`;
      }
      
      throw new Error(JSON.stringify(errorDetails));
    }

    const model = getGoogleAIModel(workingModel.model);
    const result = await model.generateContent('Say OK if you can hear me');
    const response = await result.response;
    const text = response.text();

    results.googleAI = {
      status: 'ok',
      message: 'Google AI connection successful',
      details: {
        response: text.trim(),
        model: workingModel.model,
        note: 'Auto-detected working model'
      }
    };
  } catch (error) {
    let errorDetails = {};
    try {
      errorDetails = JSON.parse(error.message);
    } catch {
      errorDetails = { message: error.message };
    }
    
    results.googleAI = {
      status: 'error',
      message: errorDetails.message || error.message,
      error: error.code || 'GOOGLE_AI_FAILED',
      ...errorDetails,
      suggestion: errorDetails.suggestion || 'Try checking your API key at https://aistudio.google.com/ and ensure Generative AI API is enabled'
    };
  }

  // ===============================
  // SUPABASE TEST (Storage)
  // ===============================
  try {
    if (
      !process.env.SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      results.supabase = {
        status: 'warning',
        message: 'Supabase not configured (optional)',
        details: {
          SUPABASE_URL: process.env.SUPABASE_URL ? 'set' : 'not set',
          SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
            ? 'set'
            : 'not set'
        }
      };
    } else {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.storage.listBuckets();

      if (error) throw error;

      results.supabase = {
        status: 'ok',
        message: 'Supabase connection successful',
        details: {
          bucketsCount: data.length
        }
      };
    }
  } catch (error) {
    results.supabase = {
      status: 'error',
      message: error.message,
      error: error.code || 'SUPABASE_FAILED'
    };
  }

  // ===============================
  // ENVIRONMENT CHECK
  // ===============================
  const envVars = {
    PORT: process.env.PORT || 'not set (default 3000)',
    NODE_ENV: process.env.NODE_ENV || 'not set',
    DATABASE_URL: process.env.DATABASE_URL ? 'set ✓' : 'not set ✗',
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? 'set ✓' : 'not set ✗',
    SUPABASE_URL: process.env.SUPABASE_URL ? 'set ✓' : 'not set (optional)',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
      ? 'set ✓'
      : 'not set (optional)'
  };

  const requiredVars = ['DATABASE_URL', 'GOOGLE_API_KEY'];
  const missingRequired = requiredVars.filter(v => !process.env[v]);

  results.environment = {
    status: missingRequired.length === 0 ? 'ok' : 'warning',
    message:
      missingRequired.length === 0
        ? 'All required environment variables are set'
        : `Missing required variables: ${missingRequired.join(', ')}`,
    variables: envVars
  };

  // ===============================
  // OVERALL STATUS
  // ===============================
  const statuses = Object.values(results).map(r => r.status);
  const overallStatus = statuses.includes('error')
    ? 'error'
    : statuses.includes('warning')
    ? 'warning'
    : 'ok';

  res.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    results
  });
});

// ===============================
// SIMPLE HEALTH CHECK
// ===============================
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ===============================
// LIST AVAILABLE GOOGLE AI MODELS
// ===============================
router.get('/models', async (req, res) => {
  try {
    const { listModels } = require('../config/googleai');
    const result = await listModels();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===============================
// CREATE SUPABASE BUCKET
// ===============================
router.post('/create-bucket', async (req, res) => {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Supabase not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file'
      });
    }

    const bucketName = req.body.bucketName || 'book-uploads';
    await ensureBucketExists(bucketName);

    res.json({
      success: true,
      message: `Bucket "${bucketName}" created successfully!`,
      bucketName: bucketName
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      suggestion: 'Make sure you have the correct SUPABASE_SERVICE_ROLE_KEY with admin permissions'
    });
  }
});

// ===============================
// QUICK GOOGLE AI TEST
// ===============================
router.get('/google-ai', async (req, res) => {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'GOOGLE_API_KEY not set in .env file',
        message: 'Please add GOOGLE_API_KEY to your .env file. Get your key from https://aistudio.google.com/'
      });
    }

    const { generateText, findWorkingModel } = require('../config/googleai');
    
    // Find working model
    const workingModel = await findWorkingModel();
    
    if (!workingModel.success) {
      return res.status(500).json({
        success: false,
        error: 'No working model found',
        details: {
          tested: workingModel.tested,
          errors: workingModel.errors,
          suggestion: 'Check your API key at https://aistudio.google.com/ and ensure Generative AI API is enabled'
        }
      });
    }

    // Test with a simple prompt
    const testPrompt = 'Say "Hello! Google AI is working correctly." if you can hear me.';
    const result = await generateText(testPrompt, { model: workingModel.model });

    res.json({
      success: true,
      message: 'Google AI is working correctly!',
      details: {
        model: workingModel.model,
        apiKeySet: true,
        testResponse: result.text,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to connect to Google AI. Check your API key and try again.'
    });
  }
});

module.exports = router;
