import express from 'express';
import { getPool } from '../config/database.js';

const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const pool = getPool();
    
    // Test database connection
    const result = await pool.query('SELECT NOW() as timestamp');
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      dbTimestamp: result.rows[0].timestamp
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Readiness check (for Kubernetes-style deployments)
router.get('/ready', async (req, res) => {
  try {
    const pool = getPool();
    
    // Test database connection and basic query
    await pool.query('SELECT 1');
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Liveness check (for Kubernetes-style deployments)
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router; 