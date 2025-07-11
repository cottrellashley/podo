import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// For DigitalOcean managed databases, disable SSL certificate verification
if (process.env.NODE_ENV === 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Database configuration
const getDatabaseConfig = () => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    // For production and cloud providers, always use SSL with proper configuration
    const isProduction = process.env.NODE_ENV === 'production';
    const isCloudDatabase = databaseUrl.includes('ondigitalocean.com') || 
                           databaseUrl.includes('amazonaws.com') ||
                           databaseUrl.includes('sslmode=require');
    
    let sslConfig = false;
    
    if (isProduction || isCloudDatabase) {
      // For DigitalOcean managed databases, use minimal SSL config
      sslConfig = {
        rejectUnauthorized: false
      };
    }
    
    return {
      connectionString: databaseUrl,
      ssl: sslConfig,
      // Additional connection options for stability
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 10
    };
  }

  // Fallback to individual environment variables
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'podo',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10
  };
};

// Create and export the connection pool
let pool = null;

export const getPool = () => {
  if (!pool) {
    const config = getDatabaseConfig();
    
    // Log configuration for debugging (without sensitive data)
    console.log('🔧 Database configuration:', {
      ssl: config.ssl ? 'enabled' : 'disabled',
      connectionTimeoutMillis: config.connectionTimeoutMillis,
      max: config.max,
      hasConnectionString: !!config.connectionString
    });
    
    pool = new Pool(config);
    
    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
    
    // Handle connection events
    pool.on('connect', (client) => {
      console.log('🔌 New database client connected');
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
  const client = await pool.connect();
  
  try {
    console.log('🔌 Using dedicated client for database initialization');
    
    // Create users table
    await client.query(`
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
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_objects (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        object_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create user_week_objects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_week_objects (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        scheduled_item_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_objects_user_id ON user_objects(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_week_objects_user_id ON user_week_objects(user_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    // Always release the client back to the pool
    client.release();
  }
}; 