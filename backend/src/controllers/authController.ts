// backend/src/controllers/authController.ts
import { Request, Response } from "express";
import { jqsPool } from "../config/db";
import { generateToken } from "../utils/token";

/**
 * POST /auth/login
 * Login with email and password
 * Sets an HTTP-only cookie with the JWT token
 * Also returns the token in the response body for clients that need it
 */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validate the input
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Query the database for the user
    const [rows]: any = await jqsPool.query(
      "SELECT login, email, pswd FROM sec_njqs_users WHERE email = ? AND pswd = ?",
      [email, password]
    );
    
    // If no user found, return authentication error
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    const user = rows[0];
    
    // Generate a JWT
    const token = generateToken(user.login);
    
    // Set the token as an HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use HTTPS in production
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    // Also return the token in the response body for compatibility
    // This provides flexibility for clients that may not support cookies
    return res.json({ 
      message: "Login successful",
      token: token,
      user: {
        login: user.login,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * POST /auth/logout
 * Clears the authentication cookie
 */
export const logout = (req: Request, res: Response) => {
  // Clear the cookie
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  });
  
  return res.json({ message: "Logged out successfully" });
};

/**
 * GET /auth/check
 * Check if the user is authenticated
 * Used by the frontend to verify session status
 */
export const checkAuth = (req: Request, res: Response) => {
  // The auth middleware will already have checked the token
  // If we get here, the user is authenticated
  return res.json({ 
    authenticated: true, 
    user: (req as any).user 
  });
};