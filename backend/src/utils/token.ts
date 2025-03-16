// backend/src/utils/token.ts
import jwt from 'jsonwebtoken';

// Get the JWT secret from environment variables or use a fallback (for development only)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';

// Set token expiration time
const TOKEN_EXPIRY = '24h'; 

/**
 * Generate a JWT token for user authentication
 * 
 * @param userId The user identifier to be encoded in the token
 * @returns A signed JWT token
 */
export const generateToken = (userId: string | number): string => {
  try {
    // Create the payload
    const payload = {
      sub: userId,           // The subject (user identifier)
      iat: Date.now() / 1000 // Issued at timestamp
    };

    // Sign and return the token
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  } catch (error) {
    console.error('Error generating token:', error);
    throw new Error('Failed to generate authentication token');
  }
};

/**
 * Verify and decode a JWT token
 * 
 * @param token The JWT token to verify
 * @returns The decoded token payload
 * @throws Error if the token is invalid or expired
 */
export const verifyToken = (token: string): any => {
  try {
    // Verify the token and return the decoded payload
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Error verifying token:', error);
    throw new Error('Invalid or expired token');
  }
};

/**
 * Extract user ID from a decoded token
 * 
 * @param decoded The decoded token payload
 * @returns The user ID from the token
 */
export const getUserIdFromToken = (decoded: any): string | number => {
  if (!decoded || !decoded.sub) {
    throw new Error('Invalid token payload');
  }
  return decoded.sub;
};