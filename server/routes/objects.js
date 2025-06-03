import express from 'express';
import { getPool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all objects for the authenticated user
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT object_data FROM user_objects WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    
    const objects = result.rows.map(row => ({
      ...row.object_data,
      createdAt: new Date(row.object_data.createdAt)
    }));
    
    res.json(objects);
  } catch (error) {
    console.error('Error fetching objects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new object
router.post('/', async (req, res) => {
  try {
    const object = req.body;
    
    if (!object.id || !object.title) {
      return res.status(400).json({ error: 'Object ID and title are required' });
    }

    const pool = getPool();
    await pool.query(
      'INSERT INTO user_objects (id, user_id, object_data) VALUES ($1, $2, $3)',
      [object.id, req.user.id, JSON.stringify(object)]
    );
    
    res.status(201).json(object);
  } catch (error) {
    console.error('Error creating object:', error);
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Object with this ID already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update an existing object
router.put('/:id', async (req, res) => {
  try {
    const objectId = req.params.id;
    const object = req.body;
    
    if (object.id !== objectId) {
      return res.status(400).json({ error: 'Object ID mismatch' });
    }

    const pool = getPool();
    const result = await pool.query(
      'UPDATE user_objects SET object_data = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [JSON.stringify(object), objectId, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Object not found' });
    }
    
    res.json(object);
  } catch (error) {
    console.error('Error updating object:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete an object
router.delete('/:id', async (req, res) => {
  try {
    const objectId = req.params.id;

    const pool = getPool();
    const result = await pool.query(
      'DELETE FROM user_objects WHERE id = $1 AND user_id = $2',
      [objectId, req.user.id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Object not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting object:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk sync objects (replace all user objects)
router.post('/bulk-sync', async (req, res) => {
  try {
    const { objects } = req.body;
    
    if (!Array.isArray(objects)) {
      return res.status(400).json({ error: 'Objects must be an array' });
    }

    const pool = getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Clear existing objects
      await client.query('DELETE FROM user_objects WHERE user_id = $1', [req.user.id]);
      
      // Insert new objects
      for (const object of objects) {
        await client.query(
          'INSERT INTO user_objects (id, user_id, object_data) VALUES ($1, $2, $3)',
          [object.id, req.user.id, JSON.stringify(object)]
        );
      }
      
      await client.query('COMMIT');
      
      res.json(objects);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error bulk syncing objects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 