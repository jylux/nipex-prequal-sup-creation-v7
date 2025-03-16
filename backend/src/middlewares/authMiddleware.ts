// backend/src/middlewares/authMiddleware.ts

import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/token"; // Ensure correct path to token.ts

export const authenticateUser = (req: Request, res: Response, next: NextFunction): void | Response => {
  const token = req.cookies?.token || req.headers["authorization"];

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = verifyToken(token);
    (req as any).user = decoded; // Attach user data to request object
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

