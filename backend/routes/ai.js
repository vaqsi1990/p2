const express = require('express');
const router = express.Router();
const { generateText, chat, generateFairyTaleCharacters, replaceChildInTemplate } = require('../config/googleai');

// Generate text with Google AI
router.post('/generate', async (req, res) => {
    try {
        const { prompt, model, temperature, maxOutputTokens } = req.body;
        
        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: 'Prompt is required'
            });
        }
        
        const options = {
            model: model || 'gemini-2.5-flash',
            temperature: temperature,
            maxOutputTokens: maxOutputTokens
        };
        
        const result = await generateText(prompt, options);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('AI generation error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate text'
        });
    }
});

// Chat with Google AI (with conversation history)
router.post('/chat', async (req, res) => {
    try {
        const { message, history, model, temperature, maxOutputTokens } = req.body;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }
        
        const options = {
            model: model || 'gemini-2.5-flash',
            history: history || [],
            temperature: temperature,
            maxOutputTokens: maxOutputTokens
        };
        
        const result = await chat(message, options);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('AI chat error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to chat with AI'
        });
    }
});

// Simple text completion endpoint
router.post('/complete', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({
                success: false,
                error: 'Text is required'
            });
        }
        
        const prompt = `Complete the following text: ${text}`;
        const result = await generateText(prompt);
        
        res.json({
            success: true,
            original: text,
            completion: result.text
        });
    } catch (error) {
        console.error('AI completion error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to complete text'
        });
    }
});

// Generate fairy tale characters from uploaded images
router.post('/fairy-tale-characters', async (req, res) => {
    try {
        const { imageUrls, model, backgroundImageUrl } = req.body;
        
        if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Image URLs array is required'
            });
        }
        
        const options = {
            model: model || 'gemini-2.5-flash',
            backgroundImageUrl: backgroundImageUrl || null
        };
        
        const result = await generateFairyTaleCharacters(imageUrls, options);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Fairy tale character generation error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate fairy tale characters'
        });
    }
});

// Replace child in template image with uploaded child photo
router.post('/replace-child', async (req, res) => {
    try {
        const { childImageUrl, templateImageUrl, model } = req.body;
        
        if (!childImageUrl) {
            return res.status(400).json({
                success: false,
                error: 'Child image URL is required'
            });
        }
        
        if (!templateImageUrl) {
            return res.status(400).json({
                success: false,
                error: 'Template image URL is required'
            });
        }
        
        const options = {
            model: model || 'gemini-2.5-flash'
        };
        
        const result = await replaceChildInTemplate(childImageUrl, templateImageUrl, options);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Child replacement error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to replace child in template'
        });
    }
});

module.exports = router;

