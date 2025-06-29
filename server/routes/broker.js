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

    // For Zerodha, generate login URL with proper redirect URL
    if (brokerName.toLowerCase() === 'zerodha') {
      try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const redirectUrl = `${baseUrl}/api/broker/auth/zerodha/callback?connection_id=${connectionId}`;
        
        const loginUrl = await kiteService.generateLoginUrl(apiKey, redirectUrl);
        res.json({ 
          message: 'Broker credentials stored. Please complete authentication.',
          connectionId,
          loginUrl,
          webhookUrl,
          requiresAuth: true,
          redirectUrl
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

// Zerodha OAuth callback handler - This is the redirect URL endpoint
router.get('/auth/zerodha/callback', async (req, res) => {
  try {
    const { request_token, action, status, connection_id } = req.query;

    console.log('📡 Zerodha callback received:', { request_token, action, status, connection_id });

    // Check if authentication was successful
    if (action !== 'login' || status !== 'success' || !request_token) {
      return res.status(400).send(`
        <html>
          <head><title>Authentication Failed</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #dc3545;">❌ Authentication Failed</h1>
            <p>Zerodha authentication was not successful.</p>
            <p>Error: ${status || 'Unknown error'}</p>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">Close Window</button>
          </body>
        </html>
      `);
    }

    if (!connection_id) {
      return res.status(400).send(`
        <html>
          <head><title>Missing Connection ID</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #dc3545;">❌ Missing Connection ID</h1>
            <p>Connection ID is required for authentication.</p>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">Close Window</button>
          </body>
        </html>
      `);
    }

    // Get broker connection
    const connection = await db.getAsync(
      'SELECT * FROM broker_connections WHERE id = ?',
      [connection_id]
    );

    if (!connection) {
      return res.status(404).send(`
        <html>
          <head><title>Connection Not Found</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #dc3545;">❌ Connection Not Found</h1>
            <p>Broker connection not found.</p>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">Close Window</button>
          </body>
        </html>
      `);
    }

    try {
      // Generate access token
      const apiKey = decryptData(connection.api_key);
      const apiSecret = decryptData(connection.api_secret);
      
      const authData = await kiteService.generateAccessToken(apiKey, apiSecret, request_token);

      // Store access token and public token
      await db.runAsync(`
        UPDATE broker_connections 
        SET access_token = ?, public_token = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [encryptData(authData.access_token), encryptData(authData.public_token), connection_id]);

      // Initialize Kite instance and sync initial data
      await kiteService.initializeKite({
        ...connection,
        access_token: encryptData(authData.access_token)
      });

      // Sync positions and holdings in background
      setTimeout(async () => {
        try {
          await kiteService.syncPositions(connection_id);
          await kiteService.syncHoldings(connection_id);
          console.log('✅ Initial data sync completed for connection:', connection_id);
        } catch (syncError) {
          console.error('Failed to sync initial data:', syncError);
        }
      }, 1000);

      // Return success page
      res.send(`
        <html>
          <head>
            <title>Authentication Successful</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f8f9fa; }
              .success-container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
              .success-icon { font-size: 48px; margin-bottom: 20px; }
              .success-title { color: #28a745; margin-bottom: 15px; }
              .success-message { color: #6c757d; margin-bottom: 30px; line-height: 1.6; }
              .close-btn { padding: 12px 24px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
              .close-btn:hover { background: #218838; }
            </style>
          </head>
          <body>
            <div class="success-container">
              <div class="success-icon">✅</div>
              <h1 class="success-title">Authentication Successful!</h1>
              <p class="success-message">
                Your Zerodha account has been successfully connected to AutoTraderHub.<br>
                You can now close this window and return to the dashboard.
              </p>
              <button class="close-btn" onclick="window.close()">Close Window</button>
            </div>
            <script>
              // Auto-close after 5 seconds
              setTimeout(() => {
                window.close();
              }, 5000);
            </script>
          </body>
        </html>
      `);

    } catch (authError) {
      console.error('Authentication error:', authError);
      res.status(500).send(`
        <html>
          <head><title>Authentication Error</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #dc3545;">❌ Authentication Error</h1>
            <p>Failed to complete authentication: ${authError.message}</p>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">Close Window</button>
          </body>
        </html>
      `);
    }

  } catch (error) {
    console.error('Callback handler error:', error);
    res.status(500).send(`
      <html>
        <head><title>Server Error</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #dc3545;">❌ Server Error</h1>
          <p>An unexpected error occurred: ${error.message}</p>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">Close Window</button>
        </body>
        </html>
    `);
  }
});

// Complete Zerodha authentication with request token (alternative method)
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