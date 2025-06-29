import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./autotrader.db');

// Custom Promise-based db.runAsync to return lastID and changes
db.runAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

// Standard promisified methods
db.getAsync = promisify(db.get.bind(db));
db.allAsync = promisify(db.all.bind(db));

// Initialize all database tables
export const initDatabase = async () => {
  try {
    // Users table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        mobileNumber TEXT,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Pending registrations table - stores user data before OTP verification
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS pending_registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT,
        password TEXT NOT NULL,
        mobileNumber TEXT,
        name TEXT NOT NULL,
        identifier TEXT NOT NULL, -- email or mobile number used for OTP
        created_at INTEGER NOT NULL, -- Unix timestamp
        expires_at INTEGER NOT NULL -- Unix timestamp
      )
    `);

    // OTPs table to store verification codes
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS otps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        identifier TEXT NOT NULL, -- Can be email or mobile number
        type TEXT NOT NULL, -- 'email' or 'mobile'
        otp TEXT NOT NULL,
        purpose TEXT NOT NULL DEFAULT 'registration', -- 'registration' or 'password_reset'
        expires_at INTEGER NOT NULL, -- Unix timestamp
        created_at INTEGER NOT NULL
      )
    `);

    // Password reset tokens table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        identifier TEXT NOT NULL,
        token TEXT NOT NULL,
        expires_at INTEGER NOT NULL, -- Unix timestamp
        created_at INTEGER NOT NULL
      )
    `);

    // Enhanced Broker connections table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS broker_connections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        broker_name TEXT NOT NULL,
        api_key TEXT NOT NULL,
        api_secret TEXT NOT NULL,
        user_id_broker TEXT,
        access_token TEXT,
        public_token TEXT,
        webhook_url TEXT,
        is_active BOOLEAN DEFAULT 1,
        last_sync DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(user_id, broker_name)
      )
    `);

    // Orders table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        broker_connection_id INTEGER NOT NULL,
        broker_order_id TEXT,
        symbol TEXT NOT NULL,
        exchange TEXT NOT NULL DEFAULT 'NSE',
        quantity INTEGER NOT NULL,
        order_type TEXT NOT NULL, -- MARKET, LIMIT, SL, SL-M
        transaction_type TEXT NOT NULL, -- BUY, SELL
        product TEXT NOT NULL DEFAULT 'MIS', -- CNC, MIS, NRML
        price DECIMAL(10,2),
        trigger_price DECIMAL(10,2),
        executed_price DECIMAL(10,2),
        executed_quantity INTEGER DEFAULT 0,
        status TEXT DEFAULT 'PENDING', -- PENDING, OPEN, COMPLETE, CANCELLED, REJECTED
        status_message TEXT,
        pnl DECIMAL(10,2) DEFAULT 0,
        webhook_data TEXT, -- JSON data from TradingView
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (broker_connection_id) REFERENCES broker_connections (id)
      )
    `);

    // Positions table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        broker_connection_id INTEGER NOT NULL,
        symbol TEXT NOT NULL,
        exchange TEXT NOT NULL DEFAULT 'NSE',
        quantity INTEGER NOT NULL,
        average_price DECIMAL(10,2) NOT NULL,
        current_price DECIMAL(10,2),
        pnl DECIMAL(10,2) DEFAULT 0,
        pnl_percentage DECIMAL(5,2) DEFAULT 0,
        product TEXT NOT NULL DEFAULT 'MIS',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (broker_connection_id) REFERENCES broker_connections (id),
        UNIQUE(user_id, broker_connection_id, symbol, product)
      )
    `);

    // Holdings table (for long-term investments)
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS holdings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        broker_connection_id INTEGER NOT NULL,
        symbol TEXT NOT NULL,
        exchange TEXT NOT NULL DEFAULT 'NSE',
        quantity INTEGER NOT NULL,
        average_price DECIMAL(10,2) NOT NULL,
        current_price DECIMAL(10,2),
        pnl DECIMAL(10,2) DEFAULT 0,
        pnl_percentage DECIMAL(5,2) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (broker_connection_id) REFERENCES broker_connections (id),
        UNIQUE(user_id, broker_connection_id, symbol)
      )
    `);

    // Webhook logs table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS webhook_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        broker_connection_id INTEGER,
        payload TEXT NOT NULL,
        status TEXT NOT NULL, -- RECEIVED, PROCESSING, SUCCESS, ERROR
        error_message TEXT,
        order_id INTEGER,
        processing_time INTEGER, -- milliseconds
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (broker_connection_id) REFERENCES broker_connections (id),
        FOREIGN KEY (order_id) REFERENCES orders (id)
      )
    `);

    // Market data table (for caching live prices)
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS market_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        exchange TEXT NOT NULL DEFAULT 'NSE',
        last_price DECIMAL(10,2),
        change DECIMAL(10,2),
        change_percent DECIMAL(5,2),
        volume INTEGER,
        high DECIMAL(10,2),
        low DECIMAL(10,2),
        open DECIMAL(10,2),
        close DECIMAL(10,2),
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(symbol, exchange)
      )
    `);

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

export { db };