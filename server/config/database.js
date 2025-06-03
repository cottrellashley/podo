import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration
const getDatabaseConfig = () => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    // For DigitalOcean and other cloud providers, always use SSL with rejectUnauthorized: false
    const needsSSL = databaseUrl.includes('ondigitalocean.com') || 
                     databaseUrl.includes('sslmode=require') || 
                     process.env.NODE_ENV === 'production';
    
    return {
      connectionString: databaseUrl,
      ssl: needsSSL ? { rejectUnauthorized: false } : false,
    };
  }

  // Fallback to individual environment variables
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'podo',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  };
};

// Create and export the connection pool
let pool = null;

export const getPool = () => {
  if (!pool) {
    const config = getDatabaseConfig();
    pool = new Pool(config);
    
    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  
  return pool;
};

// Close the pool (useful for cleanup)
export const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

// Test database connection
export const testConnection = async () => {
  try {
    const client = await getPool().connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Initialize database tables
export const initializeDatabase = async () => {
  const pool = getPool();
  
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash TEXT NOT NULL,
        salt VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create user_objects table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_objects (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        object_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create user_week_objects table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_week_objects (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        scheduled_item_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_objects_user_id ON user_objects(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_week_objects_user_id ON user_week_objects(user_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}; 