// Mock email service - replace with actual email service like SendGrid, Nodemailer, etc.
export const sendOTP = async (identifier, otp, type = 'email') => {
  // Simulate email/SMS sending delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log(`📧 [MOCK EMAIL SERVICE] Sending OTP to ${identifier}`);
  console.log(`📧 OTP Code: ${otp}`);
  console.log(`📧 Type: ${type}`);
  console.log(`📧 Message: Your AutoTraderHub verification code is: ${otp}. This code will expire in 10 minutes.`);
  
  // In production, replace this with actual email/SMS service
  // For now, we'll just log it to console so you can see the OTP
  
  return {
    success: true,
    messageId: `mock_${Date.now()}`,
    message: 'OTP sent successfully'
  };
};

export const sendPasswordResetOTP = async (identifier, otp) => {
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log(`🔐 [MOCK EMAIL SERVICE] Sending Password Reset OTP to ${identifier}`);
  console.log(`🔐 OTP Code: ${otp}`);
  console.log(`🔐 Message: Your AutoTraderHub password reset code is: ${otp}. This code will expire in 10 minutes.`);
  
  return {
    success: true,
    messageId: `reset_${Date.now()}`,
    message: 'Password reset OTP sent successfully'
  };
};