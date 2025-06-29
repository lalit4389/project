import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, Zap, Shield, BarChart3, Bot, Layers } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-dark-950 via-olive-950 to-dark-900">
      {/* Enhanced 3D Background Elements */}
      <div className="absolute inset-0 perspective-2000">
        {/* Floating 3D Cubes */}
        <motion.div
          animate={{
            y: [0, -30, 0],
            rotateX: [0, 360, 0],
            rotateY: [0, 180, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-20 w-20 h-20 bg-gradient-to-r from-olive-500 to-olive-700 opacity-20"
          style={{ 
            transform: 'perspective(1000px) rotateX(45deg) rotateY(45deg)',
            transformStyle: 'preserve-3d',
            boxShadow: '0 0 40px rgba(138, 156, 112, 0.3)'
          }}
        />
        
        <motion.div
          animate={{
            y: [0, 25, 0],
            rotateX: [0, -180, 0],
            rotateZ: [0, 90, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute top-40 right-32 w-16 h-16 bg-gradient-to-r from-dark-600 to-olive-600 opacity-30"
          style={{ 
            transform: 'perspective(1000px) rotateX(-30deg) rotateY(60deg)',
            transformStyle: 'preserve-3d',
            boxShadow: '0 0 30px rgba(109, 125, 86, 0.4)'
          }}
        />

        <motion.div
          animate={{
            y: [0, -20, 0],
            rotateY: [0, 360, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4
          }}
          className="absolute bottom-32 left-1/4 w-24 h-24 bg-gradient-to-r from-olive-400 to-dark-500 opacity-25"
          style={{ 
            transform: 'perspective(1000px) rotateX(60deg) rotateZ(30deg)',
            transformStyle: 'preserve-3d',
            borderRadius: '30%',
            boxShadow: '0 0 50px rgba(138, 156, 112, 0.5)'
          }}
        />

        {/* Floating Geometric Shapes */}
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/3 right-1/4 w-32 h-32 border-2 border-olive-500/30 opacity-40"
          style={{ 
            transform: 'perspective(1000px) rotateX(45deg)',
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, transparent, rgba(138, 156, 112, 0.1), transparent)'
          }}
        />

        {/* Animated Grid Background */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(rgba(138, 156, 112, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(138, 156, 112, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
              transform: 'perspective(1000px) rotateX(60deg)',
              transformOrigin: 'center bottom'
            }}
          />
        </div>

        {/* Glowing Orbs */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-olive-500/10 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-dark-500/15 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="mb-8"
        >
          <div className="inline-flex items-center px-6 py-3 bg-olive-900/20 backdrop-blur-md rounded-full border border-olive-500/30 mb-8 shadow-lg">
            <Bot className="w-5 h-5 text-olive-400 mr-3 animate-pulse" />
            <span className="text-olive-200 text-sm font-medium">
              AI-Powered Trading Automation Platform
            </span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 leading-tight">
            Trade with
            <br />
            <span className="bg-gradient-to-r from-olive-400 via-olive-300 to-olive-500 bg-clip-text text-transparent animate-pulse-glow">
              Precision
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-olive-200/80 mb-12 max-w-4xl mx-auto leading-relaxed">
            Connect TradingView alerts directly to your broker accounts. 
            Execute trades automatically with military-grade security and lightning-fast execution.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
        >
          <Link
            to="/register"
            className="group relative bg-gradient-to-r from-olive-600 to-olive-700 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-olive-500 to-olive-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <TrendingUp className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform relative z-10" />
            <span className="relative z-10">Start Trading Now</span>
          </Link>
          
          <Link
            to="#how-it-works"
            className="group bg-dark-800/50 backdrop-blur-md text-olive-200 px-10 py-5 rounded-2xl font-bold text-lg border border-olive-500/30 hover:bg-dark-700/50 hover:border-olive-400/50 transition-all transform hover:scale-105 flex items-center justify-center"
          >
            <Layers className="w-6 h-6 mr-3 group-hover:rotate-6 transition-transform" />
            Explore Features
          </Link>
        </motion.div>

        {/* Enhanced 3D Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          <motion.div
            whileHover={{ 
              scale: 1.05,
              rotateY: 5,
              rotateX: 5,
            }}
            className="group bg-dark-800/30 backdrop-blur-md rounded-3xl p-8 border border-olive-500/20 hover:border-olive-400/40 transition-all duration-500 shadow-2xl"
            style={{ 
              transformStyle: 'preserve-3d',
              perspective: '1000px'
            }}
          >
            <div className="w-16 h-16 bg-gradient-to-r from-olive-500 to-olive-600 rounded-2xl flex items-center justify-center mb-6 group-hover:animate-pulse-glow">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-white font-bold text-xl mb-4 group-hover:text-olive-300 transition-colors">Lightning Execution</h3>
            <p className="text-olive-200/70 leading-relaxed">Execute trades in under 100ms with our optimized infrastructure and direct broker connections</p>
          </motion.div>
          
          <motion.div
            whileHover={{ 
              scale: 1.05,
              rotateY: -5,
              rotateX: 5,
            }}
            className="group bg-dark-800/30 backdrop-blur-md rounded-3xl p-8 border border-olive-500/20 hover:border-olive-400/40 transition-all duration-500 shadow-2xl"
            style={{ 
              transformStyle: 'preserve-3d',
              perspective: '1000px'
            }}
          >
            <div className="w-16 h-16 bg-gradient-to-r from-dark-600 to-dark-700 rounded-2xl flex items-center justify-center mb-6 group-hover:animate-pulse-glow">
              <Shield className="w-8 h-8 text-olive-300" />
            </div>
            <h3 className="text-white font-bold text-xl mb-4 group-hover:text-olive-300 transition-colors">Military-Grade Security</h3>
            <p className="text-olive-200/70 leading-relaxed">Your API keys are encrypted with AES-256 and stored with enterprise-level security protocols</p>
          </motion.div>
          
          <motion.div
            whileHover={{ 
              scale: 1.05,
              rotateY: 5,
              rotateX: -5,
            }}
            className="group bg-dark-800/30 backdrop-blur-md rounded-3xl p-8 border border-olive-500/20 hover:border-olive-400/40 transition-all duration-500 shadow-2xl"
            style={{ 
              transformStyle: 'preserve-3d',
              perspective: '1000px'
            }}
          >
            <div className="w-16 h-16 bg-gradient-to-r from-olive-600 to-olive-700 rounded-2xl flex items-center justify-center mb-6 group-hover:animate-pulse-glow">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-white font-bold text-xl mb-4 group-hover:text-olive-300 transition-colors">Advanced Analytics</h3>
            <p className="text-olive-200/70 leading-relaxed">Track performance with AI-powered insights, detailed P&L reports, and predictive analytics</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Enhanced Scroll Indicator */}
      <motion.div
        animate={{ 
          y: [0, 15, 0],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-8 h-14 border-2 border-olive-400/50 rounded-full flex justify-center backdrop-blur-sm">
          <motion.div 
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-6 bg-gradient-to-b from-olive-400 to-transparent rounded-full mt-2"
          />
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;