import { getPool } from '../config/database';
import type { ObjectType, ScheduledItem } from '../types';

// Database table interfaces
export interface DBUser {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  salt: string;
  created_at: Date;
  last_login_at: Date;
}

export interface DBUserObject {
  id: string;
  user_id: string;
  object_data: ObjectType;
  created_at: Date;
  updated_at: Date;
}

export interface DBUserWeekObject {
  id: string;
  user_id: string;
  scheduled_item_data: ScheduledItem;
  created_at: Date;
  updated_at: Date;
}

// Database initialization - create tables if they don't exist
export const initializeDatabase = async (): Promise<void> => {
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

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// User operations
export const createUser = async (user: Omit<DBUser, 'created_at' | 'last_login_at'>): Promise<DBUser> => {
  const pool = getPool();
  
  try {
    const result = await pool.query(
      `INSERT INTO users (id, email, name, password_hash, salt) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [user.id, user.email, user.name, user.password_hash, user.salt]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getUserByEmail = async (email: string): Promise<DBUser | null> => {
  const pool = getPool();
  
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

export const getUserById = async (id: string): Promise<DBUser | null> => {
  const pool = getPool();
  
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

export const updateUserLastLogin = async (id: string): Promise<void> => {
  const pool = getPool();
  
  try {
    await pool.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [id]
    );
  } catch (error) {
    console.error('Error updating user last login:', error);
    throw error;
  }
};

// User objects operations
export const getUserObjects = async (userId: string): Promise<ObjectType[]> => {
  const pool = getPool();
  
  try {
    const result = await pool.query(
      'SELECT object_data FROM user_objects WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    return result.rows.map(row => ({
      ...row.object_data,
      createdAt: new Date(row.object_data.createdAt)
    }));
  } catch (error) {
    console.error('Error getting user objects:', error);
    throw error;
  }
};

export const createUserObject = async (userId: string, object: ObjectType): Promise<void> => {
  const pool = getPool();
  
  try {
    await pool.query(
      'INSERT INTO user_objects (id, user_id, object_data) VALUES ($1, $2, $3)',
      [object.id, userId, JSON.stringify(object)]
    );
  } catch (error) {
    console.error('Error creating user object:', error);
    throw error;
  }
};

export const updateUserObject = async (userId: string, object: ObjectType): Promise<void> => {
  const pool = getPool();
  
  try {
    await pool.query(
      'UPDATE user_objects SET object_data = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3',
      [JSON.stringify(object), object.id, userId]
    );
  } catch (error) {
    console.error('Error updating user object:', error);
    throw error;
  }
};

export const deleteUserObject = async (userId: string, objectId: string): Promise<void> => {
  const pool = getPool();
  
  try {
    await pool.query(
      'DELETE FROM user_objects WHERE id = $1 AND user_id = $2',
      [objectId, userId]
    );
  } catch (error) {
    console.error('Error deleting user object:', error);
    throw error;
  }
};

// User week objects operations
export const getUserWeekObjects = async (userId: string): Promise<ScheduledItem[]> => {
  const pool = getPool();
  
  try {
    const result = await pool.query(
      'SELECT scheduled_item_data FROM user_week_objects WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    return result.rows.map(row => ({
      ...row.scheduled_item_data,
      data: {
        ...row.scheduled_item_data.data,
        createdAt: new Date(row.scheduled_item_data.data.createdAt)
      }
    }));
  } catch (error) {
    console.error('Error getting user week objects:', error);
    throw error;
  }
};

export const createUserWeekObject = async (userId: string, scheduledItem: ScheduledItem): Promise<void> => {
  const pool = getPool();
  
  try {
    await pool.query(
      'INSERT INTO user_week_objects (id, user_id, scheduled_item_data) VALUES ($1, $2, $3)',
      [scheduledItem.id, userId, JSON.stringify(scheduledItem)]
    );
  } catch (error) {
    console.error('Error creating user week object:', error);
    throw error;
  }
};

export const updateUserWeekObject = async (userId: string, scheduledItem: ScheduledItem): Promise<void> => {
  const pool = getPool();
  
  try {
    await pool.query(
      'UPDATE user_week_objects SET scheduled_item_data = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3',
      [JSON.stringify(scheduledItem), scheduledItem.id, userId]
    );
  } catch (error) {
    console.error('Error updating user week object:', error);
    throw error;
  }
};

export const deleteUserWeekObject = async (userId: string, scheduledItemId: string): Promise<void> => {
  const pool = getPool();
  
  try {
    await pool.query(
      'DELETE FROM user_week_objects WHERE id = $1 AND user_id = $2',
      [scheduledItemId, userId]
    );
  } catch (error) {
    console.error('Error deleting user week object:', error);
    throw error;
  }
};

// Bulk operations for data migration/sync
export const bulkCreateUserObjects = async (userId: string, objects: ObjectType[]): Promise<void> => {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Clear existing objects
    await client.query('DELETE FROM user_objects WHERE user_id = $1', [userId]);
    
    // Insert new objects
    for (const object of objects) {
      await client.query(
        'INSERT INTO user_objects (id, user_id, object_data) VALUES ($1, $2, $3)',
        [object.id, userId, JSON.stringify(object)]
      );
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error bulk creating user objects:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const bulkCreateUserWeekObjects = async (userId: string, scheduledItems: ScheduledItem[]): Promise<void> => {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Clear existing week objects
    await client.query('DELETE FROM user_week_objects WHERE user_id = $1', [userId]);
    
    // Insert new week objects
    for (const item of scheduledItems) {
      await client.query(
        'INSERT INTO user_week_objects (id, user_id, scheduled_item_data) VALUES ($1, $2, $3)',
        [item.id, userId, JSON.stringify(item)]
      );
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error bulk creating user week objects:', error);
    throw error;
  } finally {
    client.release();
  }
}; 