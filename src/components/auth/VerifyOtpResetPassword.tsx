import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface VerifyOtpForm {
  otp: string;
}

const VerifyOtpResetPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const identifier = location.state?.identifier; // Get identifier from state passed during navigation

  const { register, handleSubmit, formState: { errors } } = useForm<VerifyOtpForm>();

  const onSubmit = async (data: VerifyOtpForm) => {
    if (!identifier) {
      toast.error("Identifier not found. Please go back to the forgot password page.");
      return;
    }

    setIsLoading(true);
    try {
      // Assuming you are using the existing /verify-otp endpoint for now
      // You might create a dedicated /verify-otp-reset endpoint if needed
      const response = await authAPI.verifyOtp({ identifier, otp: data.otp });
      toast.success(response.data.message);
      // Navigate to the reset password page, passing the identifier
      navigate('/reset-password', { state: { identifier } });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-olive-950 to-dark-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Background Spheres - (assuming similar background as Register/Login) */}
      <div className="absolute inset-0 perspective-2000">
         {/* Add your background sphere motion divs here */}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, rotateX: -15 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-md w-full space-y-8"
        key="verify-otp-form-container"
        style={{ perspective: '1000px' }}
      >
        <motion.div
          whileHover={{
            scale: 1.02,
            rotateY: 2,
            rotateX: 2,
          }}
          key="verify-otp-form-card"
          className="bg-dark-800/20 backdrop-blur-xl rounded-3xl p-8 border border-olive-500/20 shadow-2xl"
          style={{
            transformStyle: 'preserve-3d',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(138, 156, 112, 0.1)'
          }}
        >
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-3">Verify OTP</h2>
            <p className="text-olive-200/70">
              An OTP has been sent to {identifier}. Please enter it below to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-olive-200/90 mb-2">
                OTP Code
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-olive-400/50" />
                <input
                  {...register('otp', {
                    required: 'OTP is required',
                    minLength: {
                      value: 6,
                      message: 'OTP must be 6 digits'
                    },
                    maxLength: {
                      value: 6,
                      message: 'OTP must be 6 digits'
                    }
                  })}
                  type="text"
                  className="w-full pl-12 pr-4 py-4 bg-dark-800/30 border border-olive-500/20 rounded-xl text-white placeholder-olive-300/50 focus:ring-2 focus:ring-olive-500 focus:border-transparent transition-all backdrop-blur-sm"
                  placeholder="Enter OTP"
                />
              </div>
              {errors.otp && (
                <p className="mt-2 text-sm text-red-400">{errors.otp.message}</p>
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
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </motion.button>

            {/* Optional: Add a Resend OTP button */}
             {/* <div className="text-center mt-4">
               <button
                 type="button"
                 onClick={() => {
                   // TODO: Implement resend OTP logic
                   toast.info("Resending OTP...");
                 }}
                 className="text-olive-400 hover:text-olive-300 font-medium transition-colors"
               >
                 Resend OTP
               </button>
             </div> */}
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

export default VerifyOtpResetPassword;