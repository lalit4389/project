import nodemailer from 'nodemailer';

// Create transporter with explicit Gmail SMTP configuration
const createTransporter = () => {
  const config = {
    // Use explicit SMTP configuration instead of service shorthand
    host: 'smtp.gmail.com',
    port: 587, // Use 587 for STARTTLS (more reliable than 465)
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    // Enhanced connection settings for better reliability
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000,   // 30 seconds
    socketTimeout: 60000,     // 60 seconds
    // Remove the problematic TLS configuration to use modern secure defaults
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
  };

  return nodemailer.createTransporter(config);
};

let transporter;

// Initialize transporter only if credentials are available
const initializeEmailService = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Email service not configured - EMAIL_USER and EMAIL_PASS environment variables are required');
    console.warn('📧 To enable email functionality:');
    console.warn('   1. Set EMAIL_USER to your Gmail address');
    console.warn('   2. Enable 2-Factor Authentication on your Google Account');
    console.warn('   3. Generate an App Password from Google Account Security settings');
    console.warn('   4. Set EMAIL_PASS to the App Password (not your regular password)');
    console.warn('📧 Email functionality will be simulated in console logs');
    return null;
  }

  try {
    transporter = createTransporter();
    
    // Verify transporter configuration with proper error handling
    const verifyPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Email service verification timeout after 15 seconds'));
      }, 15000); // Increased timeout to 15 seconds

      transporter.verify((error, success) => {
        clearTimeout(timeout);
        if (error) {
          reject(error);
        } else {
          resolve(success);
        }
      });
    });

    verifyPromise
      .then(() => {
        console.log('✅ Email service is ready to send emails');
      })
      .catch((error) => {
        console.error('❌ Email service configuration error:', error.message);
        if (error.code === 'ETIMEDOUT' || error.message.includes('Greeting never received')) {
          console.warn('🔧 Connection timeout detected. This usually means:');
          console.warn('   1. Invalid Gmail credentials (check EMAIL_USER and EMAIL_PASS)');
          console.warn('   2. Need to use App Password instead of regular password');
          console.warn('   3. Network connectivity issues');
        }
        console.warn('📧 Email functionality will be simulated in console logs until resolved');
        transporter = null;
      });

    return transporter;
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error.message);
    console.warn('📧 Email functionality will be simulated in console logs');
    return null;
  }
};

// Initialize the service
initializeEmailService();

export const sendOTP = async (identifier, otp, type = 'email') => {
  try {
    console.log(`📧 Attempting to send OTP to ${identifier} (type: ${type})`);
    
    if (type === 'email') {
      // If no transporter available, simulate email sending
      if (!transporter) {
        console.log('📧 [EMAIL SIMULATION] Sending OTP email to:', identifier);
        console.log('📧 [EMAIL SIMULATION] OTP Code:', otp);
        console.log('📧 [EMAIL SIMULATION] Subject: AutoTraderHub - Email Verification Code');
        console.log('📧 [EMAIL SIMULATION] Email would contain verification code and instructions');
        
        return {
          success: true,
          messageId: `simulated_email_${Date.now()}`,
          message: 'OTP email sent successfully (simulated - check console for details)',
          simulated: true
        };
      }

      const mailOptions = {
        from: {
          name: 'AutoTraderHub',
          address: process.env.EMAIL_USER
        },
        to: identifier,
        subject: 'AutoTraderHub - Email Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background: linear-gradient(135deg, #8a9c70 0%, #6d7d56 100%); padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">📈 AutoTraderHub</h1>
              <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Automated Trading Platform</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #333; margin-bottom: 20px; text-align: center;">Email Verification Required</h2>
              
              <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                Thank you for registering with AutoTraderHub! To complete your account setup, please verify your email address using the code below:
              </p>
              
              <div style="background: #f8f9fa; border: 2px dashed #8a9c70; border-radius: 10px; padding: 25px; text-align: center; margin: 25px 0;">
                <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Your verification code is:</p>
                <h1 style="color: #8a9c70; font-size: 36px; font-weight: bold; margin: 0; letter-spacing: 5px; font-family: 'Courier New', monospace;">${otp}</h1>
              </div>
              
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                  ⚠️ <strong>Important:</strong> This code will expire in 10 minutes for security reasons.
                </p>
              </div>
              
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                If you didn't create an account with AutoTraderHub, please ignore this email or contact our support team.
              </p>
              
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  This is an automated message from AutoTraderHub. Please do not reply to this email.
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                © 2024 AutoTraderHub. All rights reserved.
              </p>
            </div>
          </div>
        `
      };

      console.log('📧 Sending email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });

      // Add timeout wrapper for sendMail operation
      const sendMailPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Email sending timeout after 30 seconds'));
        }, 30000);

        transporter.sendMail(mailOptions, (error, info) => {
          clearTimeout(timeout);
          if (error) {
            reject(error);
          } else {
            resolve(info);
          }
        });
      });

      const info = await sendMailPromise;
      console.log(`✅ Registration OTP email sent to ${identifier}`);
      console.log(`📧 Message ID: ${info.messageId}`);
      console.log(`🔐 OTP Code: ${otp}`);
      
      return {
        success: true,
        messageId: info.messageId,
        message: 'OTP sent successfully'
      };
    } else {
      // For mobile numbers, we'll still use console logging for now
      console.log(`📱 [SMS SERVICE] Sending OTP to ${identifier}`);
      console.log(`📱 OTP Code: ${otp}`);
      console.log(`📱 Message: Your AutoTraderHub verification code is: ${otp}. This code will expire in 10 minutes.`);
      
      return {
        success: true,
        messageId: `sms_${Date.now()}`,
        message: 'SMS OTP sent successfully (simulated)'
      };
    }
  } catch (error) {
    console.error('❌ Failed to send OTP:', error);
    
    // Provide more specific error handling
    if (error.code === 'ETIMEDOUT' || error.message.includes('Greeting never received')) {
      console.error('🔧 SMTP Connection Error - This usually indicates:');
      console.error('   1. Invalid Gmail credentials');
      console.error('   2. Need to use App Password instead of regular password');
      console.error('   3. Network connectivity issues');
      console.error('📧 Falling back to simulated email sending');
      
      // Fallback to simulation for connection errors
      console.log('📧 [EMAIL SIMULATION - FALLBACK] Sending OTP email to:', identifier);
      console.log('📧 [EMAIL SIMULATION - FALLBACK] OTP Code:', otp);
      
      return {
        success: true,
        messageId: `fallback_simulation_${Date.now()}`,
        message: 'OTP sent successfully (simulated due to connection error)',
        simulated: true,
        fallback: true
      };
    }
    
    throw new Error(`Failed to send OTP: ${error.message}`);
  }
};

export const sendPasswordResetOTP = async (identifier, otp) => {
  try {
    console.log(`🔐 Attempting to send password reset OTP to ${identifier}`);
    
    // If no transporter available, simulate email sending
    if (!transporter) {
      console.log('🔐 [EMAIL SIMULATION] Sending password reset OTP email to:', identifier);
      console.log('🔐 [EMAIL SIMULATION] OTP Code:', otp);
      console.log('🔐 [EMAIL SIMULATION] Subject: AutoTraderHub - Password Reset Code');
      console.log('🔐 [EMAIL SIMULATION] Email would contain reset code and security instructions');
      
      return {
        success: true,
        messageId: `simulated_reset_${Date.now()}`,
        message: 'Password reset OTP email sent successfully (simulated - check console for details)',
        simulated: true
      };
    }
    
    const mailOptions = {
      from: {
        name: 'AutoTraderHub Security',
        address: process.env.EMAIL_USER
      },
      to: identifier,
      subject: 'AutoTraderHub - Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔒 AutoTraderHub</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333; margin-bottom: 20px; text-align: center;">Password Reset Verification</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              We received a request to reset your AutoTraderHub account password. If you made this request, please use the verification code below:
            </p>
            
            <div style="background: #f8f9fa; border: 2px dashed #dc3545; border-radius: 10px; padding: 25px; text-align: center; margin: 25px 0;">
              <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Your password reset code is:</p>
              <h1 style="color: #dc3545; font-size: 36px; font-weight: bold; margin: 0; letter-spacing: 5px; font-family: 'Courier New', monospace;">${otp}</h1>
            </div>
            
            <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="color: #721c24; margin: 0; font-size: 14px;">
                🚨 <strong>Security Notice:</strong> This code will expire in 10 minutes. If you didn't request this reset, please secure your account immediately.
              </p>
            </div>
            
            <div style="background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="color: #0c5460; margin: 0; font-size: 14px;">
                💡 <strong>Next Steps:</strong> After entering this code, you'll be able to set a new password for your account.
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              If you didn't request a password reset, please ignore this email and consider changing your password as a precaution.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                This is an automated security message from AutoTraderHub. Please do not reply to this email.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2024 AutoTraderHub. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    console.log('🔐 Sending password reset email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    // Add timeout wrapper for sendMail operation
    const sendMailPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Password reset email sending timeout after 30 seconds'));
      }, 30000);

      transporter.sendMail(mailOptions, (error, info) => {
        clearTimeout(timeout);
        if (error) {
          reject(error);
        } else {
          resolve(info);
        }
      });
    });

    const info = await sendMailPromise;
    console.log(`✅ Password reset OTP email sent to ${identifier}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`🔐 OTP Code: ${otp}`);
    
    return {
      success: true,
      messageId: info.messageId,
      message: 'Password reset OTP sent successfully'
    };
  } catch (error) {
    console.error('❌ Failed to send password reset OTP:', error);
    
    // Provide more specific error handling
    if (error.code === 'ETIMEDOUT' || error.message.includes('Greeting never received')) {
      console.error('🔧 SMTP Connection Error - This usually indicates:');
      console.error('   1. Invalid Gmail credentials');
      console.error('   2. Need to use App Password instead of regular password');
      console.error('   3. Network connectivity issues');
      console.error('🔐 Falling back to simulated password reset email sending');
      
      // Fallback to simulation for connection errors
      console.log('🔐 [EMAIL SIMULATION - FALLBACK] Sending password reset OTP email to:', identifier);
      console.log('🔐 [EMAIL SIMULATION - FALLBACK] OTP Code:', otp);
      
      return {
        success: true,
        messageId: `fallback_reset_simulation_${Date.now()}`,
        message: 'Password reset OTP sent successfully (simulated due to connection error)',
        simulated: true,
        fallback: true
      };
    }
    
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};