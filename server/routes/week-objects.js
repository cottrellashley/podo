import express from 'express';
import { getPool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all week objects for the authenticated user
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT scheduled_item_data FROM user_week_objects WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    
    const scheduledItems = result.rows.map(row => ({
      ...row.scheduled_item_data,
      data: {
        ...row.scheduled_item_data.data,
        createdAt: new Date(row.scheduled_item_data.data.createdAt)
      }
    }));
    
    res.json(scheduledItems);
  } catch (error) {
    console.error('Error fetching week objects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new week object
router.post('/', async (req, res) => {
  try {
    const scheduledItem = req.body;
    
    if (!scheduledItem.id || !scheduledItem.data) {
      return res.status(400).json({ error: 'Scheduled item ID and data are required' });
    }

    const pool = getPool();
    await pool.query(
      'INSERT INTO user_week_objects (id, user_id, scheduled_item_data) VALUES ($1, $2, $3)',
      [scheduledItem.id, req.user.id, JSON.stringify(scheduledItem)]
    );
    
    res.status(201).json(scheduledItem);
  } catch (error) {
    console.error('Error creating week object:', error);
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Week object with this ID already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update an existing week object
router.put('/:id', async (req, res) => {
  try {
    const scheduledItemId = req.params.id;
    const scheduledItem = req.body;
    
    if (scheduledItem.id !== scheduledItemId) {
      return res.status(400).json({ error: 'Scheduled item ID mismatch' });
    }

    const pool = getPool();
    const result = await pool.query(
      'UPDATE user_week_objects SET scheduled_item_data = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [JSON.stringify(scheduledItem), scheduledItemId, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Week object not found' });
    }
    
    res.json(scheduledItem);
  } catch (error) {
    console.error('Error updating week object:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a week object
router.delete('/:id', async (req, res) => {
  try {
    const scheduledItemId = req.params.id;

    const pool = getPool();
    const result = await pool.query(
      'DELETE FROM user_week_objects WHERE id = $1 AND user_id = $2',
      [scheduledItemId, req.user.id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Week object not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting week object:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk sync week objects (replace all user week objects)
router.post('/bulk-sync', async (req, res) => {
  try {
    const { scheduledItems } = req.body;
    
    if (!Array.isArray(scheduledItems)) {
      return res.status(400).json({ error: 'Scheduled items must be an array' });
    }

    const pool = getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Clear existing week objects
      await client.query('DELETE FROM user_week_objects WHERE user_id = $1', [req.user.id]);
      
      // Insert new week objects
      for (const item of scheduledItems) {
        await client.query(
          'INSERT INTO user_week_objects (id, user_id, scheduled_item_data) VALUES ($1, $2, $3)',
          [item.id, req.user.id, JSON.stringify(item)]
        );
      }
      
      await client.query('COMMIT');
      
      res.json(scheduledItems);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error bulk syncing week objects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 