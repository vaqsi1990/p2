const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get all books from Neon database
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM books ORDER BY created_at DESC');
        
        res.json({
            success: true,
            count: result.rows.length,
            books: result.rows
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch books'
        });
    }
});

// Get single book by ID from Neon database
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Book not found' 
            });
        }
        
        res.json({
            success: true,
            book: result.rows[0]
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch book'
        });
    }
});

// Create new book in Neon database
router.post('/', async (req, res) => {
    try {
        const { title, author, images } = req.body;
        
        if (!title || !images || images.length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Title and images are required' 
            });
        }
        
        const result = await pool.query(
            'INSERT INTO books (title, author, images) VALUES ($1, $2, $3) RETURNING *',
            [title || 'Untitled Book', author || 'Unknown', images]
        );
        
        res.status(201).json({
            success: true,
            message: 'Book created successfully',
            book: result.rows[0]
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create book'
        });
    }
});

// Update book in Neon database
router.put('/:id', async (req, res) => {
    try {
        const { title, author, images } = req.body;
        
        // Check if book exists
        const checkResult = await pool.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Book not found' 
            });
        }
        
        const result = await pool.query(
            'UPDATE books SET title = COALESCE($1, title), author = COALESCE($2, author), images = COALESCE($3, images), updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
            [title, author, images, req.params.id]
        );
        
        res.json({
            success: true,
            message: 'Book updated successfully',
            book: result.rows[0]
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update book'
        });
    }
});

// Delete book from Neon database
router.delete('/:id', async (req, res) => {
    try {
        // Check if book exists
        const checkResult = await pool.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Book not found' 
            });
        }
        
        const deletedBook = checkResult.rows[0];
        
        // Delete book from database
        await pool.query('DELETE FROM books WHERE id = $1', [req.params.id]);
        
        res.json({
            success: true,
            message: 'Book deleted successfully',
            book: deletedBook
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete book'
        });
    }
});

module.exports = router;
