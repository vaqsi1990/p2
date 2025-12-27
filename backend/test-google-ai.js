/**
 * Simple script to test Google AI API connection
 * Run with: node test-google-ai.js
 */

require('dotenv').config();
const { generateText, getGoogleAIModel, findWorkingModel } = require('./config/googleai');

async function testGoogleAI() {
    console.log('🔍 Testing Google AI API Connection...\n');
    
    // Check if API key exists
    if (!process.env.GOOGLE_API_KEY) {
        console.error('❌ ERROR: GOOGLE_API_KEY is not set in .env file');
        console.log('\n📝 To fix this:');
        console.log('1. Go to https://aistudio.google.com/');
        console.log('2. Get your API key');
        console.log('3. Add GOOGLE_API_KEY=your-key-here to backend/.env file\n');
        process.exit(1);
    }
    
    console.log('✅ API Key found in environment\n');
    
    // Test 1: Try to find a working model
    console.log('📋 Test 1: Finding a working model...');
    try {
        const workingModel = await findWorkingModel();
        
        if (workingModel.success) {
            console.log(`✅ Found working model: ${workingModel.model}`);
            console.log(`   Tested ${workingModel.tested} models\n`);
        } else {
            console.log('❌ No working model found');
            console.log(`   Tested ${workingModel.tested} models`);
            if (workingModel.errors && workingModel.errors.length > 0) {
                console.log('\n   Errors encountered:');
                workingModel.errors.forEach(err => {
                    console.log(`   - ${err.model}: ${err.error}`);
                });
            }
            console.log('\n💡 Suggestion: Check your API key at https://aistudio.google.com/');
            console.log('   Make sure Generative AI API is enabled for your project\n');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error finding working model:', error.message);
        process.exit(1);
    }
    
    // Test 2: Try to generate text
    console.log('📝 Test 2: Generating text with AI...');
    try {
        const testPrompt = 'Say "Hello! I am working correctly." if you can hear me.';
        const result = await generateText(testPrompt);
        
        if (result.success) {
            console.log('✅ Text generation successful!');
            console.log(`   Model used: ${result.model}`);
            console.log(`   Response: ${result.text}\n`);
        } else {
            console.log('❌ Text generation failed');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error generating text:', error.message);
        process.exit(1);
    }
    
    // Test 3: Try to get model directly
    console.log('🔧 Test 3: Direct model access...');
    try {
        const model = getGoogleAIModel('gemini-2.5-flash');
        const result = await model.generateContent('Test');
        const response = await result.response;
        const text = response.text();
        
        console.log('✅ Direct model access successful!');
        console.log(`   Response: ${text.substring(0, 50)}...\n`);
    } catch (error) {
        console.error('❌ Error with direct model access:', error.message);
        process.exit(1);
    }
    
    console.log('🎉 All tests passed! Your Google AI API is working correctly!');
    console.log('\n📚 You can now use the API endpoints:');
    console.log('   - POST /api/ai/generate');
    console.log('   - POST /api/ai/chat');
    console.log('   - POST /api/ai/complete');
}

// Run the test
testGoogleAI().catch(error => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
});

