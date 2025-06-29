import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff, TrendingUp } from 'lucide-react';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface ResetPasswordForm {
  newPassword: string;
  confirmNewPassword: string;
}

const ResetPassword: React.FC = () => {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordForm>();
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve identifier from location state
  const { identifier } = location.state || {};

  const newPassword = watch('newPassword');

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!identifier) {
      toast.error('Identifier not found. Please restart the password reset process.');
      navigate('/forgot-password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.resetPassword({
        identifier,
        newPassword: data.newPassword,
      });
      toast.success(response.data.message);
      navigate('/login'); // Navigate to login after successful reset
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Password reset failed');
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
        key="reset-password-container"
        style={{ perspective: '1000px' }}
      >
        <motion.div
          whileHover={{
            scale: 1.02,
            rotateY: 2,
            rotateX: 2,
          }}
          key="reset-password-card"
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
            <h2 className="text-4xl font-bold text-white mb-3">Reset Password</h2>
            <p className="text-olive-200/70">Set a new password for your account.</p>
             {identifier && (
              <p className="mt-4 text-sm text-olive-300">
                Resetting password for: <span className="font-semibold">{identifier}</span>
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-olive-200/90 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-olive-400/50" />
                <input
                  {...register('newPassword', {
                    required: 'New password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  type={showNewPassword ? 'text' : 'password'}
                  className="w-full pl-12 pr-14 py-4 bg-dark-800/30 border border-olive-500/20 rounded-xl text-white placeholder-olive-300/50 focus:ring-2 focus:ring-olive-500 focus:border-transparent transition-all backdrop-blur-sm"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-olive-400/50 hover:text-olive-300/70 transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-2 text-sm text-red-400">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-olive-200/90 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-olive-400/50" />
                <input
                  {...register('confirmNewPassword', {
                    required: 'Please confirm your new password',
                    validate: value => value === newPassword || 'Passwords do not match'
                  })}
                  type={showConfirmNewPassword ? 'text' : 'password'}
                  className="w-full pl-12 pr-14 py-4 bg-dark-800/30 border border-olive-500/20 rounded-xl text-white placeholder-olive-300/50 focus:ring-2 focus:ring-olive-500 focus:border-transparent transition-all backdrop-blur-sm"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-olive-400/50 hover:text-olive-300/70 transition-colors"
                >
                  {showConfirmNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmNewPassword && (
                <p className="mt-2 text-sm text-red-400">{errors.confirmNewPassword.message}</p>
              )}
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
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </motion.button>
          </form>

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

export default ResetPassword;