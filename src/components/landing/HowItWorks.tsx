import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Webhook, TrendingUp, BarChart3 } from 'lucide-react';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: Settings,
      title: 'Connect Your Broker',
      description: 'Securely link your broker account with encrypted API keys',
      color: 'from-olive-500 to-olive-600'
    },
    {
      icon: Webhook,
      title: 'Setup TradingView Alerts',
      description: 'Configure webhooks in TradingView to send alerts to our platform',
      color: 'from-olive-600 to-olive-700'
    },
    {
      icon: TrendingUp,
      title: 'Automatic Execution',
      description: 'Our system receives alerts and executes trades instantly',
      color: 'from-dark-600 to-olive-600'
    },
    {
      icon: BarChart3,
      title: 'Monitor & Analyze',
      description: 'Track performance with real-time dashboard and analytics',
      color: 'from-olive-700 to-dark-700'
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-b from-dark-950 to-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            How It 
            <span className="bg-gradient-to-r from-olive-400 to-olive-600 bg-clip-text text-transparent"> Works</span>
          </h2>
          <p className="text-xl text-olive-200/70 max-w-3xl mx-auto">
            Get started in minutes with our simple 4-step process
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection lines */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-olive-500/20 via-olive-400/40 to-olive-500/20 transform -translate-y-1/2 z-0"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className="relative mb-6">
                  <div className={`w-20 h-20 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-110`}>
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-dark-800 rounded-full flex items-center justify-center shadow-md border-2 border-olive-500/30">
                    <span className="text-sm font-bold text-olive-300">{index + 1}</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-olive-300 transition-colors">
                  {step.title}
                </h3>
                
                <p className="text-olive-200/70 leading-relaxed">
                  {step.description}
                </p>

                {/* Arrow for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 -right-4 text-olive-400/50 text-2xl">
                    →
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-16 text-center bg-gradient-to-r from-olive-600 to-olive-700 rounded-3xl p-8 md:p-12"
        >
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Automate Your Trading?
          </h3>
          <p className="text-xl text-olive-100 mb-8 max-w-2xl mx-auto">
            Join thousands of traders who have already automated their strategies with AutoTraderHub
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-olive-600 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all"
          >
            Start Your Free Trial
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;