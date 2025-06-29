import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here!!';
const ALGORITHM = 'aes-256-cbc';

// Ensure the key is exactly 32 characters
const getKey = () => {
  if (ENCRYPTION_KEY.length === 32) {
    return ENCRYPTION_KEY;
  }
  // Pad or truncate to 32 characters
  return ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32);
};

export const encryptData = (text) => {
  try {
    const key = getKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

export const decryptData = (encryptedData) => {
  try {
    const key = getKey();
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};