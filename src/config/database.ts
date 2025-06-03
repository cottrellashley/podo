import { Pool } from 'pg';
import type { PoolConfig } from 'pg';

// Database configuration
const getDatabaseConfig = (): PoolConfig => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    throw new Error('Database operations should only be performed on the server side');
  }

  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    return {
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
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
let pool: Pool | null = null;

export const getPool = (): Pool => {
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
export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await getPool().connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}; 