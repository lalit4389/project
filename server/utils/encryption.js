import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';
const ALGORITHM = 'aes-256-cbc';

// Convert hex string to Buffer and ensure it's exactly 32 bytes
const getKey = () => {
  try {
    // If the key is a hex string (64 characters), convert it to Buffer
    if (ENCRYPTION_KEY.length === 64) {
      return Buffer.from(ENCRYPTION_KEY, 'hex');
    }
    
    // If it's already 32 characters, convert to Buffer
    if (ENCRYPTION_KEY.length === 32) {
      return Buffer.from(ENCRYPTION_KEY, 'utf8');
    }
    
    // Otherwise, create a 32-byte Buffer by padding or truncating
    const keyString = ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32);
    return Buffer.from(keyString, 'utf8');
  } catch (error) {
    console.error('Key conversion error:', error);
    // Fallback: create a default 32-byte Buffer
    return Buffer.from('a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456'.substring(0, 32), 'utf8');
  }
};

export const encryptData = (text) => {
  try {
    const key = getKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, key);
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
    const decipher = crypto.createDecipher(ALGORITHM, key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};