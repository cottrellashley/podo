import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { testConnection, initializeDatabase } from './config/database.js';
import authRoutes from './routes/auth.js';
import objectsRoutes from './routes/objects.js';
import weekObjectsRoutes from './routes/week-objects.js';
import healthRoutes from './routes/health.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
      : ['http://localhost:3000', 'http://localhost:5173'];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check routes (before API prefix)
app.use('/', healthRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/objects', objectsRoutes);
app.use('/api/week-objects', weekObjectsRoutes);
app.use('/api', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Podo API Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Migration endpoints for data transfer
app.post('/api/migration/from-local', async (req, res) => {
  try {
    const { objects, scheduledItems } = req.body;
    
    // This endpoint would typically require authentication
    // For now, we'll return a simple response
    res.json({
      objectsCount: objects ? objects.length : 0,
      weekObjectsCount: scheduledItems ? scheduledItems.length : 0,
      message: 'Migration endpoint - implement authentication first'
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ error: 'Migration failed' });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🔌 Testing database connection...');
    await testConnection();
    console.log('✅ Database connection successful');
    
    console.log('🏗️  Initializing database...');
    await initializeDatabase();
    console.log('✅ Database initialized');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 CORS Origins: ${process.env.CORS_ORIGINS || 'default'}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer(); 