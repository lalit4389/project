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
 
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists
    const existingUser = await db.getAsync(
      'SELECT id FROM users WHERE email = ?',
      [normalizedEmail]
    );
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    if (!mobileNumber) {
      return res.status(400).json({ error: 'Mobile number is required' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await db.runAsync(
      'INSERT INTO users (email, password, name, mobileNumber) VALUES (?, ?, ?, ?)',
      [normalizedEmail, hashedPassword, name, mobileNumber]
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
 mobileNumber: mobileNumber,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// SEND OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { email, mobileNumber } = req.body;

    if (!email && !mobileNumber) {
      return res.status(400).json({ error: 'Email or mobile number is required' });
    }

    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes from now

    // Store OTP in the database
    await db.runAsync(
      'INSERT INTO otps (email, mobileNumber, otp_code, expires_at) VALUES (?, ?, ?, ?)',
      [email || null, mobileNumber || null, otp, expiresAt]
    );

    // TODO: Implement SMS sending logic here using an SMS gateway service
    console.log(`Generated OTP: ${otp} for ${email || mobileNumber}`); // Log for now

    res.json({ message: 'OTP sent successfully' });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// VERIFY OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ error: 'Identifier and OTP are required' });
    }

    const now = new Date().toISOString();

    // Find a matching and unexpired OTP
    const otpRecord = await db.getAsync(
      'SELECT id FROM otps WHERE (email = ? OR mobileNumber = ?) AND otp_code = ? AND expires_at > ?',
      [identifier, identifier, otp, now]
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
      return res.status(401).json({ error: 'Invalid credentials' });
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

// GET CURRENT USER
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;
