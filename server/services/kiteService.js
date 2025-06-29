import { KiteConnect } from 'kiteconnect';
import { db } from '../database/init.js';
import { encryptData, decryptData } from '../utils/encryption.js';

class KiteService {
  constructor() {
    this.kiteInstances = new Map(); // Store KiteConnect instances per user
  }

  // Initialize KiteConnect instance for a user
  async initializeKite(brokerConnection) {
    try {
      const apiKey = decryptData(brokerConnection.api_key);
      const kc = new KiteConnect({
        api_key: apiKey,
        debug: process.env.NODE_ENV === 'development'
      });

      // If we have an access token, set it
      if (brokerConnection.access_token) {
        const accessToken = decryptData(brokerConnection.access_token);
        kc.setAccessToken(accessToken);
      }

      this.kiteInstances.set(brokerConnection.id, kc);
      return kc;
    } catch (error) {
      console.error('Failed to initialize Kite instance:', error);
      throw new Error('Failed to initialize broker connection');
    }
  }

  // Get or create KiteConnect instance
  async getKiteInstance(brokerConnectionId) {
    if (this.kiteInstances.has(brokerConnectionId)) {
      return this.kiteInstances.get(brokerConnectionId);
    }

    const brokerConnection = await db.getAsync(
      'SELECT * FROM broker_connections WHERE id = ? AND is_active = 1',
      [brokerConnectionId]
    );

    if (!brokerConnection) {
      throw new Error('Broker connection not found or inactive');
    }

    return await this.initializeKite(brokerConnection);
  }

  // Generate login URL for Kite Connect
  async generateLoginUrl(apiKey) {
    try {
      const kc = new KiteConnect({ api_key: apiKey });
      return kc.getLoginURL();
    } catch (error) {
      console.error('Failed to generate login URL:', error);
      throw new Error('Failed to generate login URL');
    }
  }

  // Generate access token from request token
  async generateAccessToken(apiKey, apiSecret, requestToken) {
    try {
      const kc = new KiteConnect({ api_key: apiKey });
      const response = await kc.generateSession(requestToken, apiSecret);
      return response;
    } catch (error) {
      console.error('Failed to generate access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  // Place order
  async placeOrder(brokerConnectionId, orderParams) {
    try {
      const kc = await this.getKiteInstance(brokerConnectionId);
      
      const orderData = {
        exchange: orderParams.exchange || 'NSE',
        tradingsymbol: orderParams.symbol,
        transaction_type: orderParams.transaction_type, // BUY or SELL
        quantity: orderParams.quantity,
        order_type: orderParams.order_type || 'MARKET', // MARKET, LIMIT, SL, SL-M
        product: orderParams.product || 'MIS', // CNC, MIS, NRML
        validity: orderParams.validity || 'DAY',
        disclosed_quantity: orderParams.disclosed_quantity || 0,
        trigger_price: orderParams.trigger_price || 0,
        squareoff: orderParams.squareoff || 0,
        stoploss: orderParams.stoploss || 0,
        trailing_stoploss: orderParams.trailing_stoploss || 0,
        tag: 'AutoTraderHub'
      };

      // Add price for limit orders
      if (orderParams.order_type === 'LIMIT' && orderParams.price) {
        orderData.price = orderParams.price;
      }

      console.log('Placing order with Kite:', orderData);
      const response = await kc.placeOrder(orderData);
      
      return {
        success: true,
        order_id: response.order_id,
        data: response
      };
    } catch (error) {
      console.error('Failed to place order:', error);
      throw new Error(`Order placement failed: ${error.message}`);
    }
  }

  // Get order status
  async getOrderStatus(brokerConnectionId, orderId) {
    try {
      const kc = await this.getKiteInstance(brokerConnectionId);
      const orders = await kc.getOrders();
      const order = orders.find(o => o.order_id === orderId);
      return order;
    } catch (error) {
      console.error('Failed to get order status:', error);
      throw new Error('Failed to get order status');
    }
  }

  // Get positions
  async getPositions(brokerConnectionId) {
    try {
      const kc = await this.getKiteInstance(brokerConnectionId);
      const positions = await kc.getPositions();
      return positions;
    } catch (error) {
      console.error('Failed to get positions:', error);
      throw new Error('Failed to get positions');
    }
  }

  // Get holdings
  async getHoldings(brokerConnectionId) {
    try {
      const kc = await this.getKiteInstance(brokerConnectionId);
      const holdings = await kc.getHoldings();
      return holdings;
    } catch (error) {
      console.error('Failed to get holdings:', error);
      throw new Error('Failed to get holdings');
    }
  }

  // Get profile
  async getProfile(brokerConnectionId) {
    try {
      const kc = await this.getKiteInstance(brokerConnectionId);
      const profile = await kc.getProfile();
      return profile;
    } catch (error) {
      console.error('Failed to get profile:', error);
      throw new Error('Failed to get profile');
    }
  }

  // Get LTP (Last Traded Price)
  async getLTP(brokerConnectionId, instruments) {
    try {
      const kc = await this.getKiteInstance(brokerConnectionId);
      const ltp = await kc.getLTP(instruments);
      return ltp;
    } catch (error) {
      console.error('Failed to get LTP:', error);
      throw new Error('Failed to get LTP');
    }
  }

  // Get OHLC data
  async getOHLC(brokerConnectionId, instruments) {
    try {
      const kc = await this.getKiteInstance(brokerConnectionId);
      const ohlc = await kc.getOHLC(instruments);
      return ohlc;
    } catch (error) {
      console.error('Failed to get OHLC:', error);
      throw new Error('Failed to get OHLC');
    }
  }

  // Sync positions from broker to database
  async syncPositions(brokerConnectionId) {
    try {
      const brokerConnection = await db.getAsync(
        'SELECT * FROM broker_connections WHERE id = ? AND is_active = 1',
        [brokerConnectionId]
      );

      if (!brokerConnection) {
        throw new Error('Broker connection not found');
      }

      const positions = await this.getPositions(brokerConnectionId);
      
      // Clear existing positions for this broker connection
      await db.runAsync(
        'DELETE FROM positions WHERE broker_connection_id = ?',
        [brokerConnectionId]
      );

      // Insert new positions
      for (const position of positions.net) {
        if (position.quantity !== 0) {
          await db.runAsync(`
            INSERT INTO positions (
              user_id, broker_connection_id, symbol, exchange, quantity, 
              average_price, current_price, pnl, pnl_percentage, product
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            brokerConnection.user_id,
            brokerConnectionId,
            position.tradingsymbol,
            position.exchange,
            position.quantity,
            position.average_price,
            position.last_price,
            position.pnl,
            position.pnl ? (position.pnl / (position.average_price * Math.abs(position.quantity))) * 100 : 0,
            position.product
          ]);
        }
      }

      // Update last sync time
      await db.runAsync(
        'UPDATE broker_connections SET last_sync = CURRENT_TIMESTAMP WHERE id = ?',
        [brokerConnectionId]
      );

      console.log(`✅ Synced ${positions.net.length} positions for broker connection ${brokerConnectionId}`);
      return positions;
    } catch (error) {
      console.error('Failed to sync positions:', error);
      throw error;
    }
  }

  // Sync holdings from broker to database
  async syncHoldings(brokerConnectionId) {
    try {
      const brokerConnection = await db.getAsync(
        'SELECT * FROM broker_connections WHERE id = ? AND is_active = 1',
        [brokerConnectionId]
      );

      if (!brokerConnection) {
        throw new Error('Broker connection not found');
      }

      const holdings = await this.getHoldings(brokerConnectionId);
      
      // Clear existing holdings for this broker connection
      await db.runAsync(
        'DELETE FROM holdings WHERE broker_connection_id = ?',
        [brokerConnectionId]
      );

      // Insert new holdings
      for (const holding of holdings) {
        if (holding.quantity > 0) {
          await db.runAsync(`
            INSERT INTO holdings (
              user_id, broker_connection_id, symbol, exchange, quantity, 
              average_price, current_price, pnl, pnl_percentage
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            brokerConnection.user_id,
            brokerConnectionId,
            holding.tradingsymbol,
            holding.exchange,
            holding.quantity,
            holding.average_price,
            holding.last_price,
            holding.pnl,
            holding.pnl ? (holding.pnl / (holding.average_price * holding.quantity)) * 100 : 0
          ]);
        }
      }

      console.log(`✅ Synced ${holdings.length} holdings for broker connection ${brokerConnectionId}`);
      return holdings;
    } catch (error) {
      console.error('Failed to sync holdings:', error);
      throw error;
    }
  }
}

export default new KiteService();