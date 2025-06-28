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

    if (email) {
      // TODO: Add code here to send OTP via email
      // Store OTP in the database with type 'email'
      await db.runAsync(
        'INSERT INTO otps (identifier, type, otp, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
        [normalizedEmail, 'email', otp, expiresAt, Math.floor(Date.now() / 1000)]
      );
    } else if (mobileNumber) {
      // TODO: Add code here to send OTP via SMS using a service like Twilio
    // Store OTP in the database
    await db.runAsync(
 'INSERT INTO otps (identifier, otp, expires_at, created_at) VALUES (?, ?, ?, ?)',
 [mobileNumber, otp, expiresAt, Math.floor(Date.now() / 1000)]
 );

    // Generate JWT token
    }
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
