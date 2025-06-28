import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, TrendingUp, Phone } from 'lucide-react';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  mobileNumber: string;
};

const Register: React.FC = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otp, setOtp] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [userIdentifier, setUserIdentifier] = useState(''); // To store email or mobile for OTP verification

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const navigate = useNavigate();

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
     setIsLoading(true);
    try {
      const response = await authAPI.register(data);
      // Assuming the backend sends back the identifier (email or mobile) that needs OTP verification
      localStorage.setItem('authToken', response.data.token);
      setRegistrationSuccess(true);
      setShowOtpForm(true);
      setUserIdentifier(data.email || data.mobileNumber); // Use email or mobile as identifier
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await authAPI.verifyOtp({ identifier: userIdentifier, otp });
      toast.success(response.data.message);
      navigate('/dashboard'); // Navigate after successful OTP verification
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-olive-950 to-dark-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Background Spheres */}
      <div className="absolute inset-0 perspective-2000">
        <motion.div
          initial={{ rotateX: 0, rotateY: 0, scale: 1 }}
          // Added key for proper re-animation on prop changes if needed
          key="bg-sphere-1" 
          animate={{
            rotateX: [0, 360],
            rotateY: [0, 180],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/4 left-1/4 w-72 h-72 bg-olive-500/10 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ rotateY: 0, rotateZ: 0, scale: 1 }}
          key="bg-sphere-2"
          animate={{
            rotateY: [0, -360],
            rotateZ: [0, 180],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
            delay: 5
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-dark-500/10 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, rotateX: -15 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-md w-full space-y-8"
        key="register-form-container"
        style={{ perspective: '1000px' }}
      >
        <motion.div
          whileHover={{ 
            scale: 1.02,
            rotateY: 2,
            rotateX: 2,
          }}
          key="register-form-card"
          className="bg-dark-800/20 backdrop-blur-xl rounded-3xl p-8 border border-olive-500/20 shadow-2xl"
          style={{ 
            transformStyle: 'preserve-3d',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(138, 156, 112, 0.1)'
          }}
        >
          <div className="text-center mb-8">
            <motion.div 
              className="flex justify-center mb-6"
              key="logo-animation"
              whileHover={{ rotateY: 180 }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-20 h-20 bg-gradient-to-r from-olive-600 to-olive-700 rounded-3xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
            </motion.div>
            <h2 className="text-4xl font-bold text-white mb-3">Join AutoTraderHub</h2>
            <p className="text-olive-200/70">Create your account and start trading smarter</p>
          </div>

          <AnimatePresence mode="wait">
            {!showOtpForm ? (
              <motion.form
                key="registration-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-olive-200/90 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-olive-400/50" />
                    <input
                      {...register('name', {
                        required: 'Name is required',
                        minLength: {
                          value: 2,
                          message: 'Name must be at least 2 characters'
                        }
                      })}
                      type="text"
                      className="w-full pl-12 pr-4 py-4 bg-dark-800/30 border border-olive-500/20 rounded-xl text-white placeholder-olive-300/50 focus:ring-2 focus:ring-olive-500 focus:border-transparent transition-all backdrop-blur-sm"
                      placeholder="Enter your full name"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-400">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-olive-200/90 mb-2">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-olive-400/50" />
                    <input
                      {...register('mobileNumber', {
                        required: 'Mobile number is required',
                        minLength: {
                          value: 10,
                          message: 'Please enter a valid mobile number'
                        }
                      })}
                      type="tel" // Use type="tel" for mobile numbers
                      className="w-full pl-12 pr-4 py-4 bg-dark-800/30 border border-olive-500/20 rounded-xl text-white placeholder-olive-300/50 focus:ring-2 focus:ring-olive-500 focus:border-transparent transition-all backdrop-blur-sm"
                      placeholder="Enter your mobile number"
                    />
                  </div>
                  {errors.mobileNumber && (
                    <p className="mt-2 text-sm text-red-400">{errors.mobileNumber.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-olive-200/90 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-olive-400/50" />
                    <input
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^\S+@\S+$/i,
                          message: 'Please enter a valid email'
                        }
                      })}
                      type="email"
                      className="w-full pl-12 pr-4 py-4 bg-dark-800/30 border border-olive-500/20 rounded-xl text-white placeholder-olive-300/50 focus:ring-2 focus:ring-olive-500 focus:border-transparent transition-all backdrop-blur-sm"
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-400">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-olive-200/90 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-olive-400/50" />
                    <input
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters'
                        }
                      })}
                      type={showPassword ? 'text' : 'password'}
                      className="w-full pl-12 pr-14 py-4 bg-dark-800/30 border border-olive-500/20 rounded-xl text-white placeholder-olive-300/50 focus:ring-2 focus:ring-olive-500 focus:border-transparent transition-all backdrop-blur-sm"
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-olive-400/50 hover:text-olive-300/70 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-400">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-olive-200/90 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-olive-400/50" />
                    <input
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: value => value === password || 'Passwords do not match'
                      })}
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="w-full pl-12 pr-14 py-4 bg-dark-800/30 border border-olive-500/20 rounded-xl text-white placeholder-olive-300/50 focus:ring-2 focus:ring-olive-500 focus:border-transparent transition-all backdrop-blur-sm"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-olive-400/50 hover:text-olive-300/70 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-400">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-olive-600 bg-dark-800/30 border-olive-500/20 rounded focus:ring-olive-500 mt-1"
                    required
                  />
                  <label className="ml-2 text-sm text-olive-200/70">
                    I agree to the
                    <Link to="/terms" className="text-olive-400 hover:text-olive-300 transition-colors">
                      Terms of Service
                    </Link>{' '}
                    and
                    <Link to="/privacy" className="text-olive-400 hover:text-olive-300 transition-colors">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, rotateX: 5 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-olive-600 to-olive-700 text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    boxShadow: '0 10px 25px rgba(138, 156, 112, 0.3)'
                  }}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </motion.button>
              </motion.form>
            ) : (
              <motion.div
                key="otp-verification-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <h3 className="text-2xl font-bold text-white text-center">Verify Mobile Number</h3>
                <p className="text-olive-200/70 text-center">An OTP has been sent to {userIdentifier}. Please enter it below.</p>
                <div>
                  <label className="block text-sm font-medium text-olive-200/90 mb-2">
                    OTP Code
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-olive-400/50" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-dark-800/30 border border-olive-500/20 rounded-xl text-white placeholder-olive-300/50 focus:ring-2 focus:ring-olive-500 focus:border-transparent transition-all backdrop-blur-sm"
                      placeholder="Enter OTP"
                      required
                    />
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02, rotateX: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleOtpSubmit}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-olive-600 to-olive-700 text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    boxShadow: '0 10px 25px rgba(138, 156, 112, 0.3)'
                  }}
                >
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </motion.button>
                {/* You can add a Resend OTP button here */}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 text-center">
            <p className="text-olive-200/70">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-olive-400 hover:text-olive-300 font-medium transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Register;