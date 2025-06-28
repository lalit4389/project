import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Link, Shield, CheckCircle, AlertCircle, Settings, Zap } from 'lucide-react';
import { brokerAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface BrokerConnectionForm {
  brokerName: string;
  apiKey: string;
  apiSecret: string;
  userId: string;
}

const BrokerConnection: React.FC = () => {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<BrokerConnectionForm>();
  const selectedBroker = watch('brokerName');

  const brokers = [
    { id: 'zerodha', name: 'Zerodha', logo: '🔥', description: 'India\'s largest stockbroker' },
    { id: 'upstox', name: 'Upstox', logo: '⚡', description: 'Next-generation trading platform' },
    { id: '5paisa', name: '5Paisa', logo: '💎', description: 'Cost-effective trading solution' }
  ];

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await brokerAPI.getConnections();
      setConnections(response.data.connections);
    } catch (error) {
      toast.error('Failed to fetch broker connections');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: BrokerConnectionForm) => {
    try {
      await brokerAPI.connect(data);
      toast.success('Broker connected successfully!');
      reset();
      fetchConnections();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to connect broker');
    }
  };

  const disconnectBroker = async (connectionId: number) => {
    try {
      await brokerAPI.disconnect(connectionId);
      toast.success('Broker disconnected successfully!');
      fetchConnections();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to disconnect broker');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header with 3D Effects */}
      <motion.div
        initial={{ opacity: 0, y: 20, rotateX: -10 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Broker Connections</h1>
          <p className="text-olive-200/70">Connect your broker accounts to enable automated trading</p>
        </div>
      </motion.div>

      {/* Enhanced Security Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        whileHover={{ scale: 1.01, rotateX: 2 }}
        className="bg-olive-800/20 backdrop-blur-xl border border-olive-500/30 rounded-2xl p-6 shadow-xl"
        style={{ 
          transformStyle: 'preserve-3d',
          boxShadow: '0 20px 40px -12px rgba(138, 156, 112, 0.2)'
        }}
      >
        <div className="flex items-start space-x-4">
          <motion.div
            animate={{ rotateY: [0, 360] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          >
            <Shield className="w-8 h-8 text-olive-400 flex-shrink-0 mt-1" />
          </motion.div>
          <div>
            <h3 className="font-bold text-olive-300 mb-2 text-lg">Your Security is Our Priority</h3>
            <p className="text-olive-200/80">
              All API keys are encrypted using AES-256 encryption and stored securely. 
              We never store your login credentials and only use read-only permissions where possible.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Connected Brokers Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        whileHover={{ scale: 1.005 }}
        className="bg-dark-800/50 backdrop-blur-xl rounded-2xl p-6 border border-olive-500/20 shadow-xl"
        style={{ 
          transformStyle: 'preserve-3d',
          boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.4)'
        }}
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <Zap className="w-6 h-6 mr-2 text-olive-400" />
          Connected Brokers
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {brokers.map((broker, index) => {
            const connection = connections.find(c => c.broker_name.toLowerCase() === broker.id);
            const isConnected = connection?.is_active;
            
            return (
              <motion.div
                key={broker.id}
                initial={{ opacity: 0, y: 30, rotateY: -15 }}
                animate={{ opacity: 1, y: 0, rotateY: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ 
                  scale: 1.05,
                  rotateY: 5,
                  rotateX: 5,
                }}
                className={`group p-6 rounded-2xl border-2 transition-all duration-500 ${
                  isConnected
                    ? 'border-olive-500/40 bg-olive-800/20'
                    : 'border-olive-500/20 bg-dark-800/30'
                } backdrop-blur-xl shadow-xl`}
                style={{ 
                  transformStyle: 'preserve-3d',
                  boxShadow: isConnected 
                    ? '0 20px 40px -12px rgba(138, 156, 112, 0.3)' 
                    : '0 20px 40px -12px rgba(0, 0, 0, 0.3)'
                }}
              >
                <div className="text-center">
                  <motion.div 
                    className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300"
                    whileHover={{ rotateY: 180 }}
                    transition={{ duration: 0.6 }}
                  >
                    {broker.logo}
                  </motion.div>
                  <h3 className="font-bold text-white mb-2 text-xl group-hover:text-olive-300 transition-colors">
                    {broker.name}
                  </h3>
                  <p className="text-olive-200/70 mb-6">
                    {broker.description}
                  </p>
                  
                  <div className="flex items-center justify-center space-x-2 mb-6">
                    {isConnected ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-olive-400" />
                        <span className="text-olive-300 font-medium">Connected</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-olive-400/50" />
                        <span className="text-olive-200/70">Not Connected</span>
                      </>
                    )}
                  </div>
                  
                  {isConnected ? (
                    <div className="space-y-3">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full bg-olive-600 text-white py-3 rounded-xl hover:bg-olive-700 transition-colors flex items-center justify-center space-x-2 font-medium"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </motion.button>
                      <motion.button
                        onClick={() => disconnectBroker(connection.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full bg-red-800/30 text-red-300 py-3 rounded-xl hover:bg-red-700/40 transition-colors font-medium"
                      >
                        Disconnect
                      </motion.button>
                    </div>
                  ) : (
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full bg-dark-700 text-olive-200 py-3 rounded-xl hover:bg-dark-600 transition-colors font-medium"
                    >
                      Connect
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Enhanced Connection Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.005 }}
        className="bg-dark-800/50 backdrop-blur-xl rounded-2xl p-6 border border-olive-500/20 shadow-xl"
        style={{ 
          transformStyle: 'preserve-3d',
          boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.4)'
        }}
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <Link className="w-6 h-6 mr-2 text-olive-400" />
          Connect New Broker
        </h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-olive-200 mb-2">
              Select Broker
            </label>
            <select
              {...register('brokerName', { required: 'Please select a broker' })}
              className="w-full px-4 py-3 bg-dark-800/50 border border-olive-500/20 rounded-xl text-white focus:ring-2 focus:ring-olive-500 focus:border-transparent backdrop-blur-sm"
            >
              <option value="">Choose a broker...</option>
              <option value="zerodha">Zerodha</option>
              <option value="upstox">Upstox</option>
              <option value="5paisa">5Paisa</option>
            </select>
            {errors.brokerName && (
              <p className="mt-1 text-sm text-red-400">{errors.brokerName.message}</p>
            )}
          </div>

          {selectedBroker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-olive-200 mb-2">
                  API Key
                </label>
                <input
                  {...register('apiKey', { required: 'API Key is required' })}
                  type="password"
                  className="w-full px-4 py-3 bg-dark-800/50 border border-olive-500/20 rounded-xl text-white placeholder-olive-300/50 focus:ring-2 focus:ring-olive-500 focus:border-transparent backdrop-blur-sm"
                  placeholder="Enter your API key"
                />
                {errors.apiKey && (
                  <p className="mt-1 text-sm text-red-400">{errors.apiKey.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-olive-200 mb-2">
                  API Secret
                </label>
                <input
                  {...register('apiSecret', { required: 'API Secret is required' })}
                  type="password"
                  className="w-full px-4 py-3 bg-dark-800/50 border border-olive-500/20 rounded-xl text-white placeholder-olive-300/50 focus:ring-2 focus:ring-olive-500 focus:border-transparent backdrop-blur-sm"
                  placeholder="Enter your API secret"
                />
                {errors.apiSecret && (
                  <p className="mt-1 text-sm text-red-400">{errors.apiSecret.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-olive-200 mb-2">
                  User ID
                </label>
                <input
                  {...register('userId', { required: 'User ID is required' })}
                  type="text"
                  className="w-full px-4 py-3 bg-dark-800/50 border border-olive-500/20 rounded-xl text-white placeholder-olive-300/50 focus:ring-2 focus:ring-olive-500 focus:border-transparent backdrop-blur-sm"
                  placeholder="Enter your user ID"
                />
                {errors.userId && (
                  <p className="mt-1 text-sm text-red-400">{errors.userId.message}</p>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02, rotateX: 5 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-gradient-to-r from-olive-600 to-olive-700 text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all flex items-center justify-center space-x-2"
                style={{ 
                  boxShadow: '0 10px 25px rgba(138, 156, 112, 0.3)'
                }}
              >
                <Link className="w-5 h-5" />
                <span>Connect Broker</span>
              </motion.button>
            </motion.div>
          )}
        </form>
      </motion.div>
    </div>
  );
};

export default BrokerConnection;