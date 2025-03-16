import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

/**
 * Generate a JWT token for a given user ID.
 * @param userId - The ID of the user (number or string).
 * @returns A signed JWT token valid for 24 hours.
 */
export const generateToken = (userId: number | string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "24h" });
};

/**
 * Verify a given JWT token.
 * @param token - The JWT token to verify.
 * @returns The decoded token payload if valid.
 * @throws If the token is invalid or expired.
 */
export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET);
};
