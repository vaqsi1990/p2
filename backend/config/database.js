const { Pool } = require('pg');
require('dotenv').config();

// Validate DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.warn('⚠️  WARNING: DATABASE_URL is not set in .env file');
    console.warn('   The server will start but database operations will fail.');
    console.warn('   Please add DATABASE_URL to your .env file:');
    console.warn('   DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require');
}

// Neon PostgreSQL connection pool
const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection
pool.on('connect', () => {
    console.log('Connected to Neon PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Initialize database tables
const initDatabase = async () => {
    if (!databaseUrl) {
        console.error('❌ Cannot initialize database: DATABASE_URL is not set');
        return;
    }
    
    try {
        const createBooksTableQuery = `
            CREATE TABLE IF NOT EXISTS books (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                author VARCHAR(255),
                images TEXT[] DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        
        const createImagesTableQuery = `
            CREATE TABLE IF NOT EXISTS images (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2),
                image_url TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        
        const createOrdersTableQuery = `
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                image_id INTEGER NOT NULL REFERENCES images(id) ON DELETE CASCADE,
                customer_name VARCHAR(255) NOT NULL,
                customer_email VARCHAR(255) NOT NULL,
                customer_phone VARCHAR(50) NOT NULL,
                customer_address TEXT NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                notes TEXT,
                total_price DECIMAL(10, 2),
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        
        const createPromoCodesTableQuery = `
            CREATE TABLE IF NOT EXISTS promo_codes (
                id SERIAL PRIMARY KEY,
                code VARCHAR(6) NOT NULL UNIQUE,
                discount_percentage DECIMAL(5, 2) NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        
        await pool.query(createBooksTableQuery);
        await pool.query(createImagesTableQuery);
        await pool.query(createOrdersTableQuery);
        await pool.query(createPromoCodesTableQuery);
        console.log('✅ Database tables initialized');
    } catch (error) {
        console.error('❌ Error initializing database:', error.message);
        if (error.message.includes('password')) {
            console.error('   💡 Tip: Check that your DATABASE_URL includes a valid password');
            console.error('   Format: postgresql://username:password@hostname/database?sslmode=require');
        }
    }
};

module.exports = {
    pool,
    initDatabase
};

