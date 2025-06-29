import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const Brokers: React.FC = () => {
  const brokers = [
    {
      name: 'Zerodha',
      logo: '🔥',
      description: 'India\'s largest stockbroker with advanced API support',
      features: ['Real-time data', 'Options trading', 'Commodity trading']
    },
    {
      name: 'Upstox',
      logo: '⚡',
      description: 'Next-generation trading platform with lightning-fast execution',
      features: ['Mobile trading', 'Advanced charts', 'Margin trading']
    },
    {
      name: '5Paisa',
      logo: '💎',
      description: 'Cost-effective trading with comprehensive market access',
      features: ['Low brokerage', 'Research reports', 'Investment advisory']
    }
  ];

  return (
    <section className="py-20 bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Supported 
            <span className="bg-gradient-to-r from-olive-400 to-olive-600 bg-clip-text text-transparent"> Brokers</span>
          </h2>
          <p className="text-xl text-olive-200/70 max-w-3xl mx-auto">
            Connect with India's leading brokers and start automating your trades today
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {brokers.map((broker, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="group bg-dark-800/30 backdrop-blur-xl rounded-2xl p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-olive-500/20 hover:border-olive-400/40"
            >
              <div className="text-center mb-6">
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {broker.logo}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-olive-300 transition-colors">
                  {broker.name}
                </h3>
                <p className="text-olive-200/70 mb-6">
                  {broker.description}
                </p>
              </div>

              <div className="space-y-3">
                {broker.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-olive-400 flex-shrink-0" />
                    <span className="text-olive-200">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-olive-500/20">
                <button className="w-full bg-gradient-to-r from-olive-600 to-olive-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105 opacity-80 group-hover:opacity-100">
                  Connect {broker.name}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center bg-gradient-to-r from-dark-800/50 to-olive-800/30 backdrop-blur-xl rounded-2xl p-8 border border-olive-500/20"
        >
          <h3 className="text-2xl font-bold text-white mb-4">
            More Brokers Coming Soon
          </h3>
          <p className="text-olive-200/70 mb-6">
            We're constantly expanding our broker integrations to give you more options
          </p>
          <div className="flex justify-center space-x-4 text-4xl opacity-50">
            <span>🏦</span>
            <span>📈</span>
            <span>💹</span>
            <span>🚀</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Brokers;