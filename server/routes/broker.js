import express from 'express';
import { db } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';
import { encryptData, decryptData } from '../utils/encryption.js';

const router = express.Router();

// Get broker connections
router.get('/connections', authenticateToken, async (req, res) => {
  try {
    const connections = await db.allAsync(
      'SELECT id, broker_name, is_active, created_at FROM broker_connections WHERE user_id = ?',
      [req.user.id]
    );

    res.json({ connections });
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({ error: 'Failed to fetch connections' });
  }
});

// Connect broker
router.post('/connect', authenticateToken, async (req, res) => {
  try {
    const { brokerName, apiKey, apiSecret, userId } = req.body;

    if (!brokerName || !apiKey || !apiSecret) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if connection already exists
    const existing = await db.getAsync(
      'SELECT id FROM broker_connections WHERE user_id = ? AND broker_name = ?',
      [req.user.id, brokerName]
    );

    if (existing) {
      // Update existing connection
      await db.runAsync(
        'UPDATE broker_connections SET api_key = ?, api_secret = ?, user_id_broker = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [encryptData(apiKey), encryptData(apiSecret), userId, existing.id]
      );
    } else {
      // Create new connection
      await db.runAsync(
        'INSERT INTO broker_connections (user_id, broker_name, api_key, api_secret, user_id_broker) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, brokerName, encryptData(apiKey), encryptData(apiSecret), userId]
      );
    }

    res.json({ message: 'Broker connected successfully' });
  } catch (error) {
    console.error('Connect broker error:', error);
    res.status(500).json({ error: 'Failed to connect broker' });
  }
});

// Disconnect broker
router.post('/disconnect', authenticateToken, async (req, res) => {
  try {
    const { connectionId } = req.body;

    await db.runAsync(
      'UPDATE broker_connections SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [connectionId, req.user.id]
    );

    res.json({ message: 'Broker disconnected successfully' });
  } catch (error) {
    console.error('Disconnect broker error:', error);
    res.status(500).json({ error: 'Failed to disconnect broker' });
  }
});

export default router;