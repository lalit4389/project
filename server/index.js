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
// Security headers
app.use(cors());

app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // requests per IP
});
app.use(limiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize database
await initDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/broker', brokerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/webhook', webhookRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack || err.message);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 route
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 AutoTraderHub API is ready`);
});
