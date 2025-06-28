import React from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Download, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

const Orders: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');

  const orders = [
    {
      id: 'ORD001',
      symbol: 'RELIANCE',
      orderType: 'BUY',
      quantity: 50,
      price: 2450,
      executedPrice: 2455,
      status: 'EXECUTED',
      timestamp: new Date('2024-01-15T10:30:00'),
      pnl: 250
    },
    {
      id: 'ORD002',
      symbol: 'TCS',
      orderType: 'SELL',
      quantity: 25,
      price: 3200,
      executedPrice: 3195,
      status: 'EXECUTED',
      timestamp: new Date('2024-01-15T11:15:00'),
      pnl: -125
    },
    {
      id: 'ORD003',
      symbol: 'HDFC',
      orderType: 'BUY',
      quantity: 100,
      price: 1650,
      executedPrice: null,
      status: 'PENDING',
      timestamp: new Date('2024-01-15T12:00:00'),
      pnl: 0
    },
    {
      id: 'ORD004',
      symbol: 'INFY',
      orderType: 'SELL',
      quantity: 75,
      price: 1450,
      executedPrice: 1455,
      status: 'EXECUTED',
      timestamp: new Date('2024-01-15T09:45:00'),
      pnl: 375
    },
    {
      id: 'ORD005',
      symbol: 'WIPRO',
      orderType: 'BUY',
      quantity: 200,
      price: 425,
      executedPrice: null,
      status: 'CANCELLED',
      timestamp: new Date('2024-01-14T15:30:00'),
      pnl: 0
    },
    {
      id: 'ORD006',
      symbol: 'MARUTI',
      orderType: 'SELL',
      quantity: 10,
      price: 9800,
      executedPrice: null,
      status: 'FAILED',
      timestamp: new Date('2024-01-14T14:20:00'),
      pnl: 0
    }
  ];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesType = typeFilter === 'all' || order.orderType.toLowerCase() === typeFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'executed':
        return 'bg-olive-800/30 text-olive-300';
      case 'pending':
        return 'bg-yellow-800/30 text-yellow-300';
      case 'cancelled':
        return 'bg-dark-700/30 text-olive-200';
      case 'failed':
        return 'bg-red-800/30 text-red-300';
      default:
        return 'bg-dark-700/30 text-olive-200';
    }
  };

  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return 'text-olive-400';
    if (pnl < 0) return 'text-red-400';
    return 'text-olive-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Order History</h1>
          <p className="text-olive-200/70 mt-1">Track all your automated and manual trades</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button className="flex items-center space-x-2 bg-olive-600 text-white px-4 py-2 rounded-lg hover:bg-olive-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-dark-800/50 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-olive-500/20"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-olive-400/50" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-800/50 border border-olive-500/20 rounded-lg text-white placeholder-olive-300/50 focus:ring-2 focus:ring-olive-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-dark-800/50 border border-olive-500/20 rounded-lg text-white focus:ring-2 focus:ring-olive-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="executed">Executed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-dark-800/50 border border-olive-500/20 rounded-lg text-white focus:ring-2 focus:ring-olive-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>

          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-olive-400/50" />
            <input
              type="date"
              className="px-4 py-2 bg-dark-800/50 border border-olive-500/20 rounded-lg text-white focus:ring-2 focus:ring-olive-500 focus:border-transparent"
            />
          </div>
        </div>
      </motion.div>

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-dark-800/50 backdrop-blur-xl rounded-2xl shadow-xl border border-olive-500/20 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-olive-800/20">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-olive-200">Order ID</th>
                <th className="text-left py-4 px-6 font-semibold text-olive-200">Symbol</th>
                <th className="text-left py-4 px-6 font-semibold text-olive-200">Type</th>
                <th className="text-left py-4 px-6 font-semibold text-olive-200">Quantity</th>
                <th className="text-left py-4 px-6 font-semibold text-olive-200">Order Price</th>
                <th className="text-left py-4 px-6 font-semibold text-olive-200">Executed Price</th>
                <th className="text-left py-4 px-6 font-semibold text-olive-200">P&L</th>
                <th className="text-left py-4 px-6 font-semibold text-olive-200">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-olive-200">Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-olive-500/10 hover:bg-olive-800/10 transition-colors"
                >
                  <td className="py-4 px-6 font-medium text-white">{order.id}</td>
                  <td className="py-4 px-6 font-medium text-white">{order.symbol}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      {order.orderType === 'BUY' ? (
                        <TrendingUp className="w-4 h-4 text-olive-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                      <span className={`font-medium ${
                        order.orderType === 'BUY' ? 'text-olive-400' : 'text-red-400'
                      }`}>
                        {order.orderType}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-olive-200">{order.quantity}</td>
                  <td className="py-4 px-6 text-olive-200">₹{order.price}</td>
                  <td className="py-4 px-6 text-olive-200">
                    {order.executedPrice ? `₹${order.executedPrice}` : '-'}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`font-medium ${getPnLColor(order.pnl)}`}>
                      {order.pnl > 0 ? '+' : ''}₹{order.pnl}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-olive-200">
                    {format(order.timestamp, 'MMM dd, HH:mm')}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-olive-400 text-lg mb-2">No orders found</div>
            <p className="text-olive-200/70">Try adjusting your search criteria</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Orders;