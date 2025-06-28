import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface ForgotPasswordForm {
  email?: string;
  mobileNumber?: string;
}

const ForgotPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [identifier, setIdentifier] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    clearErrors,
  } = useForm<ForgotPasswordForm>();
  const navigate = useNavigate();

  const emailValue = watch('email');
  const mobileNumberValue = watch('mobileNumber');

  const onSubmit = async (data: ForgotPasswordForm) => {
    if (!data.email && !data.mobileNumber) {
      setError('email', { type: 'manual', message: 'Please provide either email or mobile number.' });
      setError('mobileNumber', { type: 'manual', message: 'Please provide either email or mobile number.' });
      return;
    }
    clearErrors(['email', 'mobileNumber']);

    setIsLoading(true);
    try {
      const response = await authAPI.forgotPassword(data);
      toast.success(response.data.message || 'If a matching account was found, an OTP has been sent.');
      setRequestSent(true);
      setIdentifier(data.email || data.mobileNumber || ''); // Store the identifier for the next step
      // Optionally navigate to the OTP verification page immediately:
      // navigate('/verify-otp-reset', { state: { identifier: data.email || data.mobileNumber } });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Could not initiate password reset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-olive-950 to-dark-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-md w-full space-y-8"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-dark-800/20 backdrop-blur-xl rounded-3xl p-8 border border-olive-500/20 shadow-2xl"
          style={{
            transformStyle: 'preserve-3d',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(138, 156, 112, 0.1)',
          }}
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-3">Forgot Password</h2>
            <p className="text-olive-200/70">
              Enter your email or mobile number to receive an OTP for password reset.
            </p>
          </div>

          {!requestSent ? (
            <motion.form
              key="forgot-password-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-olive-200/90 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-olive-400/50" />
                  <input
                    {...register('email', {
                      pattern: {
                        value: emailValue ? /^\S+@\S+$/i : /.*?/, // Only validate if email is entered
                        message: 'Please enter a valid email',
                      },
                    })}
                    type="email"
                    className="w-full pl-12 pr-4 py-4 bg-dark-800/30 border border-olive-500/20 rounded-xl text-white placeholder-olive-300/50 focus:ring-2 focus:ring-olive-500 focus:border-transparent transition-all backdrop-blur-sm"
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && <p className="mt-2 text-sm text-red-400">{errors.email.message}</p>}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-olive-300/70 text-sm">OR</span>
                <hr className="w-full border-t border-olive-500/20 ml-4" />
              </div>

              <div>
                <label className="block text-sm font-medium text-olive-200/90 mb-2">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-olive-400/50" />
                  <input
                    {...register('mobileNumber', {
                      pattern: {
                        value: mobileNumberValue ? /^\d{10,}$/ : /.*?/, // Basic check if mobile is entered
                        message: 'Please enter a valid mobile number',
                      },
                    })}
                    type="tel"
                    className="w-full pl-12 pr-4 py-4 bg-dark-800/30 border border-olive-500/20 rounded-xl text-white placeholder-olive-300/50 focus:ring-2 focus:ring-olive-500 focus:border-transparent transition-all backdrop-blur-sm"
                    placeholder="Enter your mobile number"
                  />
                </div>
                {errors.mobileNumber && (
                  <p className="mt-2 text-sm text-red-400">{errors.mobileNumber.message}</p>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading || (!emailValue && !mobileNumberValue)}
                className="w-full bg-gradient-to-r from-olive-600 to-olive-700 text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  boxShadow: '0 10px 25px rgba(138, 156, 112, 0.3)',
                }}
              >
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
              </motion.button>
            </motion.form>
          ) : (
            <motion.div
              key="otp-sent-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center space-y-4"
            >
              <h3 className="text-2xl font-bold text-white">OTP Sent</h3>
              <p className="text-olive-200/70">
                If a matching account was found, an OTP has been sent to the provided {emailValue ? 'email' : 'mobile number'}.
              </p>
              <p className="text-olive-200/70">
                Please proceed to the OTP verification step.
              </p>
              <motion.button
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/verify-otp-reset', { state: { identifier: identifier } })}
                 className="w-full bg-gradient-to-r from-olive-600 to-olive-700 text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all"
                 style={{
                   boxShadow: '0 10px 25px rgba(138, 156, 112, 0.3)',
                 }}
              >
                Verify OTP
              </motion.button>
            </motion.div>
          )}

          <div className="mt-8 text-center">
            <p className="text-olive-200/70">
              Remember your password?{' '}
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

export default ForgotPassword;