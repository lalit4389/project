import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, User, LogOut } from 'lucide-react';
import { isAuthenticated, removeToken } from '../../utils/auth';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const authenticated = isAuthenticated();

  const handleLogout = () => {
    removeToken();
    navigate('/');
  };

  const isLandingPage = location.pathname === '/';

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isLandingPage 
          ? 'bg-transparent backdrop-blur-sm' 
          : 'bg-dark-900/95 backdrop-blur-xl shadow-2xl border-b border-olive-500/20'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center space-x-3">
            <motion.div 
              className="w-12 h-12 bg-gradient-to-r from-olive-600 to-olive-700 rounded-xl flex items-center justify-center shadow-lg"
              whileHover={{ rotateY: 180, scale: 1.1 }}
              transition={{ duration: 0.6 }}
            >
              <TrendingUp className="w-7 h-7 text-white" />
            </motion.div>
            <span className={`text-xl font-bold ${
              isLandingPage ? 'text-white' : 'text-olive-300'
            }`}>
              AutoTraderHub
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {!authenticated ? (
              <>
                <Link
                  to="/"
                  className={`hover:text-olive-400 transition-colors font-medium ${
                    isLandingPage ? 'text-white/90' : 'text-olive-200'
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/login"
                  className={`hover:text-olive-400 transition-colors font-medium ${
                    isLandingPage ? 'text-white/90' : 'text-olive-200'
                  }`}
                >
                  Login
                </Link>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-olive-600 to-olive-700 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all transform font-medium"
                  >
                    Get Started
                  </Link>
                </motion.div>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className={`hover:text-olive-400 transition-colors font-medium ${
                    isLandingPage ? 'text-white/90' : 'text-olive-200'
                  }`}
                >
                  Dashboard
                </Link>
                <div className="flex items-center space-x-4">
                  <motion.div 
                    className="w-10 h-10 bg-gradient-to-r from-olive-600 to-olive-700 rounded-full flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.1, rotateY: 180 }}
                    transition={{ duration: 0.6 }}
                  >
                    <User className="w-5 h-5 text-white" />
                  </motion.div>
                  <motion.button
                    onClick={handleLogout}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </motion.button>
                </div>
              </>
            )}
          </nav>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;