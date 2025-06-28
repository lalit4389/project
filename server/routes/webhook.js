import express from 'express';
import { db } from '../database/init.js';
import { placeBrokerOrder } from '../services/brokerService.js';

const router = express.Router();

// Handle TradingView webhook
router.post('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const payload = req.body;

    // Log webhook
    await db.runAsync(
      'INSERT INTO webhook_logs (user_id, payload, status) VALUES (?, ?, ?)',
      [userId, JSON.stringify(payload), 'RECEIVED']
    );

    // Validate payload
    if (!payload.symbol || !payload.action || !payload.quantity) {
      await db.runAsync(
        'UPDATE webhook_logs SET status = ?, error_message = ? WHERE user_id = ? AND id = (SELECT MAX(id) FROM webhook_logs WHERE user_id = ?)',
        ['ERROR', 'Invalid payload format', userId, userId]
      );
      return res.status(400).json({ error: 'Invalid payload format' });
    }

    // Get user's active broker connection
    const brokerConnection = await db.getAsync(
      'SELECT * FROM broker_connections WHERE user_id = ? AND is_active = 1 LIMIT 1',
      [userId]
    );

    if (!brokerConnection) {
      await db.runAsync(
        'UPDATE webhook_logs SET status = ?, error_message = ? WHERE user_id = ? AND id = (SELECT MAX(id) FROM webhook_logs WHERE user_id = ?)',
        ['ERROR', 'No active broker connection', userId, userId]
      );
      return res.status(400).json({ error: 'No active broker connection found' });
    }

    // Create order record
    const orderResult = await db.runAsync(
      'INSERT INTO orders (user_id, symbol, quantity, order_type, side, price, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        userId,
        payload.symbol,
        payload.quantity,
        payload.orderType || 'MARKET',
        payload.action,
        payload.price || null,
        'PENDING'
      ]
    );

    // Place order with broker
    try {
      const brokerResponse = await placeBrokerOrder(brokerConnection, {
        symbol: payload.symbol,
        quantity: payload.quantity,
        side: payload.action,
        orderType: payload.orderType || 'MARKET',
        price: payload.price
      });

      // Update order with broker response
      await db.runAsync(
        'UPDATE orders SET broker_order_id = ?, status = ?, executed_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [brokerResponse.orderId, brokerResponse.status, brokerResponse.executedPrice, orderResult.lastID]
      );

      // Update position if order is executed
      if (brokerResponse.status === 'EXECUTED') {
        await updatePosition(userId, payload.symbol, payload.quantity, payload.action, brokerResponse.executedPrice);
      }

      await db.runAsync(
        'UPDATE webhook_logs SET status = ? WHERE user_id = ? AND id = (SELECT MAX(id) FROM webhook_logs WHERE user_id = ?)',
        ['SUCCESS', userId, userId]
      );

      res.json({ 
        message: 'Order placed successfully',
        orderId: orderResult.lastID,
        brokerOrderId: brokerResponse.orderId
      });

    } catch (brokerError) {
      // Update order status to failed
      await db.runAsync(
        'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['FAILED', orderResult.lastID]
      );

      await db.runAsync(
        'UPDATE webhook_logs SET status = ?, error_message = ? WHERE user_id = ? AND id = (SELECT MAX(id) FROM webhook_logs WHERE user_id = ?)',
        ['ERROR', brokerError.message, userId, userId]
      );

      throw brokerError;
    }

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Update position helper function
async function updatePosition(userId, symbol, quantity, side, price) {
  try {
    const existingPosition = await db.getAsync(
      'SELECT * FROM positions WHERE user_id = ? AND symbol = ?',
      [userId, symbol]
    );

    if (existingPosition) {
      let newQuantity, newAveragePrice;
      
      if (side === 'BUY') {
        newQuantity = existingPosition.quantity + quantity;
        newAveragePrice = ((existingPosition.average_price * existingPosition.quantity) + (price * quantity)) / newQuantity;
      } else {
        newQuantity = existingPosition.quantity - quantity;
        newAveragePrice = existingPosition.average_price;
      }

      if (newQuantity === 0) {
        // Close position
        await db.runAsync(
          'DELETE FROM positions WHERE id = ?',
          [existingPosition.id]
        );
      } else {
        // Update position
        await db.runAsync(
          'UPDATE positions SET quantity = ?, average_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [newQuantity, newAveragePrice, existingPosition.id]
        );
      }
    } else if (side === 'BUY') {
      // Create new position
      await db.runAsync(
        'INSERT INTO positions (user_id, symbol, quantity, average_price) VALUES (?, ?, ?, ?)',
        [userId, symbol, quantity, price]
      );
    }
  } catch (error) {
    console.error('Update position error:', error);
  }
}

export default router;