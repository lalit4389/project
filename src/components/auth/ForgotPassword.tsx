import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Mail, Lock, TrendingUp } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

type FormStep = 1 | 2 | 3;

interface ForgotForm {
  email?: string;
  otp?: string;
  password?: string;
  confirmPassword?: string;
}

export default function ForgotPassword() {
  const [step, setStep] = useState<FormStep>(1);
  const [identifier, setIdentifier] = useState('');
  const [verifiedOtp, setVerifiedOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [timerActive, setTimerActive] = useState(false);

  // Start timer function
  const startResendTimer = () => {
    setCanResendOtp(false);
    setResendTimer(60);
    setTimerActive(true);
  };

  // Handle timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (timerActive && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setTimerActive(false);
            setCanResendOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timerActive, resendTimer]);

  // Handle resend OTP
  const handleResendOtp = async () => {
    if (!identifier) {
      toast.error('No identifier found. Please restart the process.');
      return;
    }

    try {
      setIsLoading(true);
      await authAPI.forgotPassword({ identifier });
      toast.success('OTP resent successfully');
      startResendTimer();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<ForgotForm>();
  const navigate = useNavigate();

  const password = watch('password');

  const handleNext = async (data: ForgotForm) => {
    setIsLoading(true);
    try {
      if (step === 1) {
        const id = data.email || '';
        if (!id) {
          toast.error('Please enter your email');
          setIsLoading(false);
          return;
        }
        setIdentifier(id);
        await authAPI.forgotPassword({ identifier: id });
        toast.success('OTP sent successfully');
        setStep(2);
        startResendTimer();
      } else if (step === 2) {
        if (!data.otp) {
          toast.error('Please enter the OTP');
          setIsLoading(false);
          return;
        }
        const verifyResponse = await authAPI.verifyOtp({ identifier, otp: data.otp });
        if (verifyResponse.data.message === 'OTP verified successfully') {
          setVerifiedOtp(data.otp);
          toast.success('OTP verified successfully');
          setStep(3);
        }
      } else {
        if (!data.password || !data.confirmPassword) {
          toast.error('Please enter and confirm your new password');
          setIsLoading(false);
          return;
        }
        if (data.password !== data.confirmPassword) {
          toast.error('Passwords do not match');
          setIsLoading(false);
          return;
        }
        // Validate required fields
        if (!identifier || !verifiedOtp || !data.password) {
          console.error('Missing required fields:', { identifier, otp: verifiedOtp, password: data.password });
          toast.error('Missing required fields for password reset');
          return;
        }

        try {
          console.log('Attempting password reset with:', {
            identifier,
            otp: verifiedOtp,
            newPassword: data.password
          });

          const response = await authAPI.resetPassword({
            identifier,
            otp: verifiedOtp,
            newPassword: data.password
          });

          console.log('Reset password response:', response);

          if (response.data?.message === 'Password reset successfully') {
            toast.success('Password reset successfully');
            reset();
            navigate('/login');
          } else {
            throw new Error('Unexpected response from server');
          }
        } catch (error: any) {
          console.error('Reset password error:', error);
          console.error('Error response data:', error.response?.data);
          const errorMessage = error.response?.data?.error || error.message || 'Failed to reset password';
          toast.error(errorMessage);
          throw error;
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-olive-950 to-dark-900 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative">
      <Toaster position="top-right" />
      {/* Background Spheres */}
      <div className="absolute inset-0 perspective-2000 -z-10">
        <motion.div
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
        style={{ perspective: '1000px' }}
      >
        <motion.div
          whileHover={{
            scale: 1.02,
            rotateY: 2,
            rotateX: 2,
          }}
          className="bg-dark-800/20 backdrop-blur-xl rounded-3xl p-8 border border-olive-500/20 shadow-2xl"
          style={{
            transformStyle: 'preserve-3d',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(138, 156, 112, 0.1)'
          }}
        >
          <div className="text-center mb-8">
            <motion.div
              className="flex justify-center mb-6"
              whileHover={{ rotateY: 180 }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-20 h-20 bg-gradient-to-r from-olive-600 to-olive-700 rounded-3xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
            </motion.div>
            <h2 className="text-4xl font-bold text-white mb-3">Forgot Password</h2>
            <p className="text-olive-200/70">Reset your AutoTraderHub account password</p>
            
            {/* Step indicator */}
            <div className="flex justify-center mt-6 space-x-2">
              {[1, 2, 3].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    stepNum === step
                      ? 'bg-olive-500 scale-125'
                      : stepNum < step
                      ? 'bg-olive-600'
                      : 'bg-olive-800/30'
                  }`}
                />
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(handleNext)} className="space-y-6">
            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-olive-200/90 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-olive-400/50" />
                    <input
                      type="email"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      className="w-full pl-12 pr-4 py-4 bg-dark-800/30 border border-olive-500/20 rounded-xl text-white placeholder-olive-300/50 focus:ring-2 focus:ring-olive-500 focus:border-transparent transition-all backdrop-blur-sm"
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-400">{errors.email.message}</p>
                  )}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="text-center mb-6">
                  <p className="text-sm text-olive-200/70 mb-2">
                    Enter OTP sent to
                  </p>
                  <p className="font-medium text-white text-lg">
                    {identifier}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-olive-200/90 mb-2">
                    OTP Code
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-olive-400/50" />
                    <input
                      type="text"
                      {...register('otp', {
                        required: 'OTP is required',
                        pattern: {
                          value: /^\d{6}$/,
                          message: 'OTP must be 6 digits'
                        }
                      })}
                      className="w-full pl-12 pr-4 py-4 bg-dark-800/30 border border-olive-500/20 rounded-xl text-white placeholder-olive-300/50 focus:ring-2 focus:ring-olive-500 focus:border-transparent transition-all backdrop-blur-sm text-center text-lg tracking-widest"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>
                  {errors.otp && (
                    <p className="mt-2 text-sm text-red-400">{errors.otp.message}</p>
                  )}
                </div>
                <div className="text-center">
                  {canResendOtp ? (
                    <motion.button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-olive-400 hover:text-olive-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? 'Sending...' : 'Resend OTP'}
                    </motion.button>
                  ) : (
                    <p className="text-olive-200/70 text-sm">
                      Resend OTP in {resendTimer} seconds
                    </p>
                  )}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="text-center mb-6">
                  <p className="text-sm text-olive-200/70 mb-2">
                    Set a new password for
                  </p>
                  <p className="font-medium text-white text-lg">
                    {identifier}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-olive-200/90 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-olive-400/50" />
                    <input
                      type="password"
                      {...register('password', { 
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters'
                        }
                      })}
                      className="w-full pl-12 pr-4 py-4 bg-dark-800/30 border border-olive-500/20 rounded-xl text-white placeholder-olive-300/50 focus:ring-2 focus:ring-olive-500 focus:border-transparent transition-all backdrop-blur-sm"
                      placeholder="Enter new password"
                    />
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
                      type="password"
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: value => value === password || 'Passwords do not match',
                      })}
                      className="w-full pl-12 pr-4 py-4 bg-dark-800/30 border border-olive-500/20 rounded-xl text-white placeholder-olive-300/50 focus:ring-2 focus:ring-olive-500 focus:border-transparent transition-all backdrop-blur-sm"
                      placeholder="Confirm new password"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-400">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </>
            )}

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02, rotateX: 5 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-olive-600 to-olive-700 text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                boxShadow: '0 10px 25px rgba(138, 156, 112, 0.3)',
              }}
            >
              {isLoading
                ? 'Processing...'
                : step === 1
                ? 'Send OTP'
                : step === 2
                ? 'Verify OTP'
                : 'Reset Password'}
            </motion.button>

            {step > 1 && (
              <motion.button
                type="button"
                onClick={() => {
                  setStep(step - 1);
                  reset();
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-dark-800/50 text-olive-200 py-3 rounded-xl font-medium hover:bg-dark-700/50 transition-all border border-olive-500/20"
              >
                Back
              </motion.button>
            )}
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}