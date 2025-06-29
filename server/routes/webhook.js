import express from 'express';
import { db } from '../database/init.js';
import kiteService from '../services/kiteService.js';

const router = express.Router();

// Handle TradingView webhook - Enhanced with proper broker integration
router.post('/:userId/:webhookId', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { userId, webhookId } = req.params;
    const payload = req.body;

    console.log(`📡 Webhook received for user ${userId}, webhook ${webhookId}:`, payload);

    // Log webhook receipt
    const logResult = await db.runAsync(
      'INSERT INTO webhook_logs (user_id, payload, status) VALUES (?, ?, ?)',
      [userId, JSON.stringify(payload), 'RECEIVED']
    );
    const logId = logResult.lastID;

    // Update log status to processing
    await db.runAsync(
      'UPDATE webhook_logs SET status = ? WHERE id = ?',
      ['PROCESSING', logId]
    );

    // Validate payload structure
    if (!payload.symbol || !payload.action || !payload.quantity) {
      const errorMsg = 'Invalid payload: symbol, action, and quantity are required';
      await db.runAsync(
        'UPDATE webhook_logs SET status = ?, error_message = ?, processing_time = ? WHERE id = ?',
        ['ERROR', errorMsg, Date.now() - startTime, logId]
      );
      return res.status(400).json({ error: errorMsg });
    }

    // Find broker connection by webhook URL
    const brokerConnection = await db.getAsync(`
      SELECT * FROM broker_connections 
      WHERE user_id = ? AND webhook_url LIKE ? AND is_active = 1 
      ORDER BY created_at DESC LIMIT 1
    `, [userId, `%${webhookId}%`]);

    if (!brokerConnection) {
      const errorMsg = 'No active broker connection found for this webhook';
      await db.runAsync(
        'UPDATE webhook_logs SET status = ?, error_message = ?, processing_time = ? WHERE id = ?',
        ['ERROR', errorMsg, Date.now() - startTime, logId]
      );
      return res.status(404).json({ error: errorMsg });
    }

    // Update log with broker connection
    await db.runAsync(
      'UPDATE webhook_logs SET broker_connection_id = ? WHERE id = ?',
      [brokerConnection.id, logId]
    );

    // Prepare order parameters
    const orderParams = {
      symbol: payload.symbol.toUpperCase(),
      exchange: payload.exchange || 'NSE',
      transaction_type: payload.action.toUpperCase(), // BUY or SELL
      quantity: parseInt(payload.quantity),
      order_type: payload.order_type || 'MARKET',
      product: payload.product || 'MIS',
      price: payload.price ? parseFloat(payload.price) : null,
      trigger_price: payload.trigger_price ? parseFloat(payload.trigger_price) : null,
      validity: payload.validity || 'DAY',
      tag: 'AutoTraderHub_TradingView'
    };

    // Validate order parameters
    if (orderParams.quantity <= 0) {
      const errorMsg = 'Invalid quantity: must be greater than 0';
      await db.runAsync(
        'UPDATE webhook_logs SET status = ?, error_message = ?, processing_time = ? WHERE id = ?',
        ['ERROR', errorMsg, Date.now() - startTime, logId]
      );
      return res.status(400).json({ error: errorMsg });
    }

    if (!['BUY', 'SELL'].includes(orderParams.transaction_type)) {
      const errorMsg = 'Invalid action: must be BUY or SELL';
      await db.runAsync(
        'UPDATE webhook_logs SET status = ?, error_message = ?, processing_time = ? WHERE id = ?',
        ['ERROR', errorMsg, Date.now() - startTime, logId]
      );
      return res.status(400).json({ error: errorMsg });
    }

    // Create order record in database
    const orderResult = await db.runAsync(`
      INSERT INTO orders (
        user_id, broker_connection_id, symbol, exchange, quantity, 
        order_type, transaction_type, product, price, trigger_price, 
        status, webhook_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      brokerConnection.id,
      orderParams.symbol,
      orderParams.exchange,
      orderParams.quantity,
      orderParams.order_type,
      orderParams.transaction_type,
      orderParams.product,
      orderParams.price,
      orderParams.trigger_price,
      'PENDING',
      JSON.stringify(payload)
    ]);

    const orderId = orderResult.lastID;

    // Update webhook log with order ID
    await db.runAsync(
      'UPDATE webhook_logs SET order_id = ? WHERE id = ?',
      [orderId, logId]
    );

    try {
      // Place order with broker
      console.log(`📈 Placing order with ${brokerConnection.broker_name}:`, orderParams);
      
      let brokerResponse;
      if (brokerConnection.broker_name.toLowerCase() === 'zerodha') {
        brokerResponse = await kiteService.placeOrder(brokerConnection.id, orderParams);
      } else {
        // Mock response for other brokers
        brokerResponse = {
          success: true,
          order_id: `MOCK_${Date.now()}`,
          data: { status: 'COMPLETE' }
        };
      }

      // Update order with broker response
      await db.runAsync(`
        UPDATE orders 
        SET broker_order_id = ?, status = ?, status_message = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [
        brokerResponse.order_id,
        brokerResponse.data.status || 'OPEN',
        JSON.stringify(brokerResponse.data),
        orderId
      ]);

      // If order is completed, update positions
      if (brokerResponse.data.status === 'COMPLETE') {
        try {
          await kiteService.syncPositions(brokerConnection.id);
        } catch (syncError) {
          console.error('Failed to sync positions after order completion:', syncError);
        }
      }

      // Update webhook log as successful
      await db.runAsync(
        'UPDATE webhook_logs SET status = ?, processing_time = ? WHERE id = ?',
        ['SUCCESS', Date.now() - startTime, logId]
      );

      console.log(`✅ Order placed successfully: ${brokerResponse.order_id}`);

      res.json({ 
        success: true,
        message: 'Order placed successfully',
        orderId: orderId,
        brokerOrderId: brokerResponse.order_id,
        status: brokerResponse.data.status,
        processingTime: Date.now() - startTime
      });

    } catch (brokerError) {
      console.error('Broker order placement failed:', brokerError);

      // Update order status to failed
      await db.runAsync(
        'UPDATE orders SET status = ?, status_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['REJECTED', brokerError.message, orderId]
      );

      // Update webhook log with error
      await db.runAsync(
        'UPDATE webhook_logs SET status = ?, error_message = ?, processing_time = ? WHERE id = ?',
        ['ERROR', brokerError.message, Date.now() - startTime, logId]
      );

      res.status(500).json({ 
        success: false,
        error: 'Order placement failed',
        message: brokerError.message,
        orderId: orderId
      });
    }

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Try to update log if we have the ID
    try {
      await db.runAsync(
        'UPDATE webhook_logs SET status = ?, error_message = ?, processing_time = ? WHERE user_id = ? AND status = ?',
        ['ERROR', error.message, Date.now() - startTime, req.params.userId, 'PROCESSING']
      );
    } catch (logError) {
      console.error('Failed to update webhook log:', logError);
    }

    res.status(500).json({ 
      success: false,
      error: 'Webhook processing failed',
      message: error.message
    });
  }
});

// Get webhook logs for a user
router.get('/logs/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0, status } = req.query;

    let query = `
      SELECT 
        wl.*,
        bc.broker_name,
        o.symbol as order_symbol,
        o.transaction_type,
        o.quantity as order_quantity,
        o.status as order_status
      FROM webhook_logs wl
      LEFT JOIN broker_connections bc ON wl.broker_connection_id = bc.id
      LEFT JOIN orders o ON wl.order_id = o.id
      WHERE wl.user_id = ?
    `;
    
    const params = [userId];

    if (status) {
      query += ' AND wl.status = ?';
      params.push(status.toUpperCase());
    }

    query += ' ORDER BY wl.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const logs = await db.allAsync(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM webhook_logs WHERE user_id = ?';
    let countParams = [userId];

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status.toUpperCase());
    }

    const { total } = await db.getAsync(countQuery, countParams);

    res.json({
      logs: logs.map(log => ({
        ...log,
        payload: JSON.parse(log.payload),
        processing_time: log.processing_time || 0
      })),
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });
  } catch (error) {
    console.error('Get webhook logs error:', error);
    res.status(500).json({ error: 'Failed to fetch webhook logs' });
  }
});

// Test webhook endpoint
router.post('/test/:userId/:webhookId', async (req, res) => {
  try {
    const { userId, webhookId } = req.params;
    
    // Test payload
    const testPayload = {
      symbol: 'RELIANCE',
      action: 'BUY',
      quantity: 1,
      order_type: 'MARKET',
      exchange: 'NSE',
      product: 'MIS',
      timestamp: new Date().toISOString(),
      test: true
    };

    console.log(`🧪 Test webhook for user ${userId}, webhook ${webhookId}`);

    // Find broker connection
    const brokerConnection = await db.getAsync(`
      SELECT * FROM broker_connections 
      WHERE user_id = ? AND webhook_url LIKE ? AND is_active = 1 
      ORDER BY created_at DESC LIMIT 1
    `, [userId, `%${webhookId}%`]);

    if (!brokerConnection) {
      return res.status(404).json({ 
        success: false,
        error: 'No active broker connection found for this webhook' 
      });
    }

    res.json({
      success: true,
      message: 'Webhook endpoint is active and ready to receive signals',
      brokerConnection: {
        id: brokerConnection.id,
        broker_name: brokerConnection.broker_name,
        is_active: brokerConnection.is_active,
        webhook_url: brokerConnection.webhook_url
      },
      testPayload,
      instructions: {
        url: `${req.protocol}://${req.get('host')}/api/webhook/${userId}/${webhookId}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        requiredFields: ['symbol', 'action', 'quantity'],
        optionalFields: ['order_type', 'exchange', 'product', 'price', 'trigger_price']
      }
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to test webhook endpoint' 
    });
  }
});

export default router;