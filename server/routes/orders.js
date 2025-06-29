import express from 'express';
import { db } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, symbol } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM orders WHERE user_id = ?';
    let params = [req.user.id];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status.toUpperCase());
    }

    if (symbol) {
      query += ' AND symbol LIKE ?';
      params.push(`%${symbol}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const orders = await db.allAsync(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE user_id = ?';
    let countParams = [req.user.id];

    if (status && status !== 'all') {
      countQuery += ' AND status = ?';
      countParams.push(status.toUpperCase());
    }

    if (symbol) {
      countQuery += ' AND symbol LIKE ?';
      countParams.push(`%${symbol}%`);
    }

    const { total } = await db.getAsync(countQuery, countParams);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get positions
router.get('/positions', authenticateToken, async (req, res) => {
  try {
    const positions = await db.allAsync(
      'SELECT * FROM positions WHERE user_id = ? ORDER BY updated_at DESC',
      [req.user.id]
    );

    res.json({ positions });
  } catch (error) {
    console.error('Get positions error:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

// Get P&L summary
router.get('/pnl', authenticateToken, async (req, res) => {
  try {
    const { period = '1M' } = req.query;
    
    // Calculate date range based on period
    let dateFilter = '';
    switch (period) {
      case '1W':
        dateFilter = "AND created_at >= date('now', '-7 days')";
        break;
      case '1M':
        dateFilter = "AND created_at >= date('now', '-1 month')";
        break;
      case '3M':
        dateFilter = "AND created_at >= date('now', '-3 months')";
        break;
      case '6M':
        dateFilter = "AND created_at >= date('now', '-6 months')";
        break;
      case '1Y':
        dateFilter = "AND created_at >= date('now', '-1 year')";
        break;
      default:
        dateFilter = '';
    }

    // Get total P&L
    const totalPnL = await db.getAsync(
      `SELECT 
        COALESCE(SUM(pnl), 0) as total_pnl,
        COUNT(*) as total_trades,
        COUNT(CASE WHEN pnl > 0 THEN 1 END) as winning_trades
      FROM orders 
      WHERE user_id = ? AND status = 'EXECUTED' ${dateFilter}`,
      [req.user.id]
    );

    // Get daily P&L for chart
    const dailyPnL = await db.allAsync(
      `SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(pnl), 0) as pnl,
        COUNT(*) as trades
      FROM orders 
      WHERE user_id = ? AND status = 'EXECUTED' ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30`,
      [req.user.id]
    );

    // Calculate win rate
    const winRate = totalPnL.total_trades > 0 
      ? (totalPnL.winning_trades / totalPnL.total_trades) * 100 
      : 0;

    res.json({
      summary: {
        totalPnL: totalPnL.total_pnl || 0,
        totalTrades: totalPnL.total_trades || 0,
        winRate: winRate.toFixed(2),
        winningTrades: totalPnL.winning_trades || 0
      },
      chartData: dailyPnL.reverse()
    });
  } catch (error) {
    console.error('Get P&L error:', error);
    res.status(500).json({ error: 'Failed to fetch P&L data' });
  }
});

export default router;