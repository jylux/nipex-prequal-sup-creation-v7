// backend/src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/token";

/**
 * Middleware to authenticate requests using either:
 * 1. An HTTP-only cookie (preferred and more secure)
 * 2. An Authorization header (Bearer token)
 * 
 * Attaches the decoded user information to the request object
 */
export const authenticateUser = (req: Request, res: Response, next: NextFunction): void | Response => {
  // Try to get token from cookie first (more secure)
  const cookieToken = req.cookies?.token;
  
  // Fallback to Authorization header
  const authHeader = req.headers.authorization;
  let headerToken: string | undefined;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    headerToken = authHeader.split(' ')[1];
  }
  
  // Use cookie token as primary, header token as fallback
  const token = cookieToken || headerToken;

  // If no token was found, reject the request
  if (!token) {
    return res.status(401).json({ 
      message: "Authentication required", 
      details: "No authentication token found in cookie or Authorization header" 
    });
  }

  try {
    // Verify the token and extract user information
    const decoded = verifyToken(token);
    
    // Attach the user data to the request for use in route handlers
    (req as any).user = decoded;
    
    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    // Token is invalid, expired, or tampered with
    console.error("Token verification failed:", error);
    
    // Clear the invalid cookie if present
    if (cookieToken) {
      res.clearCookie("token");
    }
    
    return res.status(401).json({ 
      message: "Authentication failed", 
      details: "Invalid or expired authentication token" 
    });
  }
};

/**
 * For API endpoints that need admin privileges
 * Use this after authenticateUser middleware
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void | Response => {
  const user = (req as any).user;
  
  // Check if the user has admin role/permission
  // This depends on how your user data is structured - modify as needed
  if (!user || !user.isAdmin) {
    return res.status(403).json({ 
      message: "Access denied", 
      details: "You don't have permission to access this resource" 
    });
  }
  
  next();
};