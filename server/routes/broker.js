import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';
import { encryptData, decryptData } from '../utils/encryption.js';
import kiteService from '../services/kiteService.js';

const router = express.Router();

// Get broker connections with enhanced data
router.get('/connections', authenticateToken, async (req, res) => {
  try {
    const connections = await db.allAsync(`
      SELECT 
        id, broker_name, is_active, created_at, last_sync, webhook_url,
        CASE WHEN access_token IS NOT NULL THEN 1 ELSE 0 END as is_authenticated
      FROM broker_connections 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [req.user.id]);

    res.json({ connections });
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({ error: 'Failed to fetch connections' });
  }
});

// Get specific broker connection details
router.get('/connections/:id', authenticateToken, async (req, res) => {
  try {
    const connection = await db.getAsync(`
      SELECT 
        id, broker_name, is_active, created_at, last_sync, webhook_url,
        user_id_broker,
        CASE WHEN access_token IS NOT NULL THEN 1 ELSE 0 END as is_authenticated
      FROM broker_connections 
      WHERE id = ? AND user_id = ?
    `, [req.params.id, req.user.id]);

    if (!connection) {
      return res.status(404).json({ error: 'Broker connection not found' });
    }

    // If authenticated, get additional broker data
    if (connection.is_authenticated) {
      try {
        const profile = await kiteService.getProfile(connection.id);
        connection.broker_profile = profile;
      } catch (error) {
        console.error('Failed to get broker profile:', error);
        connection.broker_profile = null;
      }
    }

    res.json({ connection });
  } catch (error) {
    console.error('Get connection details error:', error);
    res.status(500).json({ error: 'Failed to fetch connection details' });
  }
});

// Connect broker - Step 1: Store credentials and generate login URL
router.post('/connect', authenticateToken, async (req, res) => {
  try {
    const { brokerName, apiKey, apiSecret, userId } = req.body;

    if (!brokerName || !apiKey || !apiSecret) {
      return res.status(400).json({ error: 'Broker name, API key, and API secret are required' });
    }

    // Generate unique webhook URL for this connection
    const webhookId = uuidv4();
    const webhookUrl = `${req.protocol}://${req.get('host')}/api/webhook/${req.user.id}/${webhookId}`;

    // Check if connection already exists
    const existing = await db.getAsync(
      'SELECT id FROM broker_connections WHERE user_id = ? AND broker_name = ?',
      [req.user.id, brokerName.toLowerCase()]
    );

    let connectionId;
    if (existing) {
      // Update existing connection
      await db.runAsync(`
        UPDATE broker_connections 
        SET api_key = ?, api_secret = ?, user_id_broker = ?, webhook_url = ?, 
            is_active = 1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [encryptData(apiKey), encryptData(apiSecret), userId, webhookUrl, existing.id]);
      connectionId = existing.id;
    } else {
      // Create new connection
      const result = await db.runAsync(`
        INSERT INTO broker_connections 
        (user_id, broker_name, api_key, api_secret, user_id_broker, webhook_url) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [req.user.id, brokerName.toLowerCase(), encryptData(apiKey), encryptData(apiSecret), userId, webhookUrl]);
      connectionId = result.lastID;
    }

    // For Zerodha, generate login URL
    if (brokerName.toLowerCase() === 'zerodha') {
      try {
        const loginUrl = await kiteService.generateLoginUrl(apiKey);
        res.json({ 
          message: 'Broker credentials stored. Please complete authentication.',
          connectionId,
          loginUrl,
          webhookUrl,
          requiresAuth: true
        });
      } catch (error) {
        console.error('Failed to generate login URL:', error);
        res.status(400).json({ error: 'Invalid API key or failed to generate login URL' });
      }
    } else {
      // For other brokers, mark as connected (mock implementation)
      res.json({ 
        message: 'Broker connected successfully',
        connectionId,
        webhookUrl,
        requiresAuth: false
      });
    }
  } catch (error) {
    console.error('Connect broker error:', error);
    res.status(500).json({ error: 'Failed to connect broker' });
  }
});

// Complete Zerodha authentication with request token
router.post('/auth/zerodha', authenticateToken, async (req, res) => {
  try {
    const { connectionId, requestToken } = req.body;

    if (!connectionId || !requestToken) {
      return res.status(400).json({ error: 'Connection ID and request token are required' });
    }

    // Get broker connection
    const connection = await db.getAsync(
      'SELECT * FROM broker_connections WHERE id = ? AND user_id = ?',
      [connectionId, req.user.id]
    );

    if (!connection) {
      return res.status(404).json({ error: 'Broker connection not found' });
    }

    // Generate access token
    const apiKey = decryptData(connection.api_key);
    const apiSecret = decryptData(connection.api_secret);
    
    const authData = await kiteService.generateAccessToken(apiKey, apiSecret, requestToken);

    // Store access token and public token
    await db.runAsync(`
      UPDATE broker_connections 
      SET access_token = ?, public_token = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [encryptData(authData.access_token), encryptData(authData.public_token), connectionId]);

    // Initialize Kite instance and sync initial data
    await kiteService.initializeKite({
      ...connection,
      access_token: encryptData(authData.access_token)
    });

    // Sync positions and holdings
    try {
      await kiteService.syncPositions(connectionId);
      await kiteService.syncHoldings(connectionId);
    } catch (syncError) {
      console.error('Failed to sync initial data:', syncError);
      // Don't fail the authentication if sync fails
    }

    res.json({ 
      message: 'Zerodha authentication completed successfully',
      connectionId,
      webhookUrl: connection.webhook_url
    });
  } catch (error) {
    console.error('Zerodha auth error:', error);
    res.status(500).json({ error: 'Failed to complete authentication' });
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

// Sync positions from broker
router.post('/sync/positions/:connectionId', authenticateToken, async (req, res) => {
  try {
    const { connectionId } = req.params;

    // Verify connection belongs to user
    const connection = await db.getAsync(
      'SELECT id FROM broker_connections WHERE id = ? AND user_id = ? AND is_active = 1',
      [connectionId, req.user.id]
    );

    if (!connection) {
      return res.status(404).json({ error: 'Broker connection not found' });
    }

    const positions = await kiteService.syncPositions(connectionId);
    res.json({ 
      message: 'Positions synced successfully',
      positions: positions.net
    });
  } catch (error) {
    console.error('Sync positions error:', error);
    res.status(500).json({ error: 'Failed to sync positions' });
  }
});

// Sync holdings from broker
router.post('/sync/holdings/:connectionId', authenticateToken, async (req, res) => {
  try {
    const { connectionId } = req.params;

    // Verify connection belongs to user
    const connection = await db.getAsync(
      'SELECT id FROM broker_connections WHERE id = ? AND user_id = ? AND is_active = 1',
      [connectionId, req.user.id]
    );

    if (!connection) {
      return res.status(404).json({ error: 'Broker connection not found' });
    }

    const holdings = await kiteService.syncHoldings(connectionId);
    res.json({ 
      message: 'Holdings synced successfully',
      holdings
    });
  } catch (error) {
    console.error('Sync holdings error:', error);
    res.status(500).json({ error: 'Failed to sync holdings' });
  }
});

// Get live market data
router.get('/market-data/:connectionId', authenticateToken, async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { instruments } = req.query;

    if (!instruments) {
      return res.status(400).json({ error: 'Instruments parameter is required' });
    }

    // Verify connection belongs to user
    const connection = await db.getAsync(
      'SELECT id FROM broker_connections WHERE id = ? AND user_id = ? AND is_active = 1',
      [connectionId, req.user.id]
    );

    if (!connection) {
      return res.status(404).json({ error: 'Broker connection not found' });
    }

    const instrumentList = instruments.split(',');
    const marketData = await kiteService.getLTP(connectionId, instrumentList);

    res.json({ marketData });
  } catch (error) {
    console.error('Get market data error:', error);
    res.status(500).json({ error: 'Failed to get market data' });
  }
});

// Test broker connection
router.post('/test/:connectionId', authenticateToken, async (req, res) => {
  try {
    const { connectionId } = req.params;

    // Verify connection belongs to user
    const connection = await db.getAsync(
      'SELECT * FROM broker_connections WHERE id = ? AND user_id = ? AND is_active = 1',
      [connectionId, req.user.id]
    );

    if (!connection) {
      return res.status(404).json({ error: 'Broker connection not found' });
    }

    // Test connection by getting profile
    const profile = await kiteService.getProfile(connectionId);
    
    res.json({ 
      message: 'Broker connection is working',
      profile: {
        user_id: profile.user_id,
        user_name: profile.user_name,
        email: profile.email,
        broker: profile.broker
      }
    });
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({ error: 'Broker connection test failed' });
  }
});

export default router;