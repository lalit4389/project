import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, mobileNumber } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists
    const existingUser = await db.getAsync(
      'SELECT id FROM users WHERE email = ?',
      [normalizedEmail]
    );
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    let identifier;
    if (email) {
      identifier = normalizedEmail;
    } else if (mobileNumber) {
      identifier = mobileNumber;
    } else {
      return res.status(400).json({ error: 'Email or mobile number is required' });
    }

    if (!password || !name) {
 return res.status(400).json({ error: 'Password and name are required' });
    }


    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await db.runAsync(
      'INSERT INTO users (email, password, name, mobileNumber) VALUES (?, ?, ? ,?)',
 [email ? normalizedEmail : null, hashedPassword, name, mobileNumber ? mobileNumber : null]
    );

    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Math.floor(Date.now() / 1000) + (5 * 60); // 5 minutes from now in seconds

    const otpType = email ? 'email' : 'mobile';

    if (email) {
      // TODO: Add code here to send OTP via email
    } else if (mobileNumber) {
      // TODO: Add code here to send OTP via SMS using a service like Twilio
    }

    // Store OTP in the database
    await db.runAsync(
      'INSERT INTO otps (identifier, type, otp, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
      [identifier, otpType, otp, expiresAt, Math.floor(Date.now() / 1000)]
 );
    
    // Generate JWT token
    const token = jwt.sign({ userId: result.lastID }, JWT_SECRET, { expiresIn: '24h' });

    res.setHeader('Access-Control-Allow-Origin', '*'); // Temporary for debugging
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: result.lastID,
        email: normalizedEmail,
 name: name,
 mobileNumber: mobileNumber
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// VERIFY OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ error: 'Identifier and OTP are required' });
    }

    const now = Math.floor(Date.now() / 1000);

    // Find a matching and unexpired OTP
    const otpRecord = await db.getAsync(
      'SELECT id FROM otps WHERE identifier = ? AND otp = ? AND expires_at > ? ORDER BY created_at DESC LIMIT 1',
      [identifier, otp, now]
    );

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Delete the OTP record to prevent reuse
    await db.runAsync('DELETE FROM otps WHERE id = ?', [otpRecord.id]);

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

// VERIFY OTP FOR PASSWORD RESET
router.post('/verify-otp-reset', async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ error: 'Identifier and OTP are required' });
    }

    const now = Math.floor(Date.now() / 1000);

    // Find a matching and unexpired OTP
    const otpRecord = await db.getAsync(
      'SELECT id FROM otps WHERE identifier = ? AND otp = ? AND expires_at > ? ORDER BY created_at DESC LIMIT 1',
      [identifier, otp, now]
    );

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Generate a reset token
    const resetToken = crypto.randomUUID();
    const tokenExpiresAt = Math.floor(Date.now() / 1000) + (15 * 60); // 15 minutes from now

    // Store the reset token
    await db.runAsync(
      'INSERT INTO password_reset_tokens (identifier, token, expires_at, created_at) VALUES (?, ?, ?, ?)',
      [identifier, resetToken, tokenExpiresAt, Math.floor(Date.now() / 1000)]
    );

    // Delete the OTP record to prevent reuse
    await db.runAsync('DELETE FROM otps WHERE id = ?', [otpRecord.id]);

    res.json({ 
      message: 'OTP verified successfully',
      resetToken: resetToken
    });
  } catch (error) {
    console.error('Verify OTP for reset error:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    const user = await db.getAsync(
      'SELECT * FROM users WHERE email = ?',
      [normalizedEmail]
    );
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Wrong password' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

    res.setHeader('Access-Control-Allow-Origin', '*'); // Temporary for debugging
    res.json({
      message: 'Login successful',
      token,
 user: { id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// RESET PASSWORD - Verify Reset Token and Set New Password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required' });
    }

    const now = Math.floor(Date.now() / 1000);

    // Find a matching and unexpired reset token
    const tokenRecord = await db.getAsync(
      'SELECT id, identifier FROM password_reset_tokens WHERE token = ? AND expires_at > ? ORDER BY created_at DESC LIMIT 1',
      [resetToken, now]
    );

    if (!tokenRecord) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await db.runAsync(
      'UPDATE users SET password = ? WHERE email = ? OR mobileNumber = ?',
      [hashedPassword, tokenRecord.identifier, tokenRecord.identifier]
    );

    // Delete the reset token to prevent reuse
    await db.runAsync('DELETE FROM password_reset_tokens WHERE id = ?', [tokenRecord.id]);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// GET CURRENT USER
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// FORGOT PASSWORD - Initiate
router.post('/forgot-password', async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ error: 'Email or mobile number is required' });
    }

    // Find user by email or mobile number
    const user = await db.getAsync(
      'SELECT id, email, mobileNumber FROM users WHERE email = ? OR mobileNumber = ?',
      [identifier, identifier]
    );

    // Do NOT reveal if the user exists for security reasons
    if (!user) {
      console.log(`Forgot password attempt for unknown identifier: ${identifier}`);
      return res.json({ message: 'If a matching account is found, an OTP has been sent.' });
    }

    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Math.floor(Date.now() / 1000) + (10 * 60); // 10 minutes from now

    const otpType = user.email === identifier ? 'email' : 'mobile';

    // Store OTP in the database
    await db.runAsync(
      'INSERT INTO otps (identifier, type, otp, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
      [identifier, otpType, otp, expiresAt, Math.floor(Date.now() / 1000)]
    );

    // TODO: Add code here to send OTP via email (if otpType is 'email') or SMS (if otpType is 'mobile')

    res.json({ message: 'If a matching account is found, an OTP has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Forgot password request failed' });
  }
});

export default router;