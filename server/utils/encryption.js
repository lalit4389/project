import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'autotrader-hub-secret-key-32-chars';
const ALGORITHM = 'aes-256-cbc';

// Ensure we have a proper 32-byte key
const getKey = () => {
  try {
    let key = ENCRYPTION_KEY;
    
    // Pad or truncate to exactly 32 bytes
    if (key.length < 32) {
      key = key.padEnd(32, '0');
    } else if (key.length > 32) {
      key = key.substring(0, 32);
    }
    
    return Buffer.from(key, 'utf8');
  } catch (error) {
    console.error('Key generation error:', error);
    // Fallback to a default key
    return Buffer.from('autotrader-hub-secret-key-32-chars'.substring(0, 32), 'utf8');
  }
};

export const encryptData = (text) => {
  try {
    if (!text) {
      throw new Error('Text to encrypt cannot be empty');
    }

    const key = getKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', key);
    
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
    if (!encryptedData || typeof encryptedData !== 'string') {
      throw new Error('Invalid encrypted data');
    }

    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    const key = getKey();
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

// Test encryption/decryption
export const testEncryption = () => {
  try {
    const testData = 'test-api-key-12345';
    const encrypted = encryptData(testData);
    const decrypted = decryptData(encrypted);
    
    if (testData === decrypted) {
      console.log('✅ Encryption/Decryption test passed');
      return true;
    } else {
      console.error('❌ Encryption/Decryption test failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Encryption test error:', error);
    return false;
  }
};