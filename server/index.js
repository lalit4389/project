import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import brokerRoutes from './routes/broker.js';
import orderRoutes from './routes/orders.js';
import webhookRoutes from './routes/webhook.js';
import { initDatabase } from './database/init.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', cors());

// Security headers with relaxed CSP for development
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"],
    },
  }
}));

// Rate limiting with more lenient settings for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More requests in development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  
  // Log request body for POST/PUT requests (excluding sensitive data)
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const logBody = { ...req.body };
    // Hide sensitive fields
    if (logBody.password) logBody.password = '[HIDDEN]';
    if (logBody.apiSecret) logBody.apiSecret = '[HIDDEN]';
    if (logBody.apiKey) logBody.apiKey = `${logBody.apiKey.substring(0, 4)}...`;
    console.log(`📝 Request body:`, logBody);
  }
  
  next();
});

// Initialize database
try {
  await initDatabase();
  console.log('✅ Database initialized successfully');
} catch (error) {
  console.error('❌ Database initialization failed:', error);
  process.exit(1);
}

// Routes with logging
app.use('/api/auth', (req, res, next) => {
  console.log(`🔐 Auth route: ${req.method} ${req.path}`);
  next();
}, authRoutes);

app.use('/api/broker', (req, res, next) => {
  console.log(`🏦 Broker route: ${req.method} ${req.path}`);
  next();
}, brokerRoutes);

app.use('/api/orders', (req, res, next) => {
  console.log(`📊 Orders route: ${req.method} ${req.path}`);
  next();
}, orderRoutes);

app.use('/api/webhook', (req, res, next) => {
  console.log(`🪝 Webhook route: ${req.method} ${req.path}`);
  next();
}, webhookRoutes);

// Health check with detailed information
app.get('/api/health', (req, res) => {
  const healthInfo = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  };
  
  console.log('🏥 Health check requested:', healthInfo);
  res.json(healthInfo);
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`${timestamp} - ❌ Error in ${req.method} ${req.path}:`, err);
  
  // Log stack trace in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack trace:', err.stack);
  }
  
  const statusCode = err.statusCode || err.status || 500;
  const errorResponse = {
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    timestamp,
    path: req.path,
    method: req.method
  };
  
  res.status(statusCode).json(errorResponse);
});

// Enhanced 404 route
app.use('*', (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  
  res.status(404).json({ 
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp,
    availableRoutes: [
      'GET /api/health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/broker/connections',
      'POST /api/broker/connect'
    ]
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server with enhanced logging
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ================================');
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 AutoTraderHub API is ready`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🕒 Started at: ${new Date().toISOString()}`);
  console.log('🚀 ================================');
  
  // Log available routes
  console.log('📍 Available API routes:');
  console.log('   🔐 Auth: /api/auth/*');
  console.log('   🏦 Broker: /api/broker/*');
  console.log('   📊 Orders: /api/orders/*');
  console.log('   🪝 Webhook: /api/webhook/*');
  console.log('   🏥 Health: /api/health');
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please use a different port or stop the existing server.`);
  }
  process.exit(1);
});

export default app;