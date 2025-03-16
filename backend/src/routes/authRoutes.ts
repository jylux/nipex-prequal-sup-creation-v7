// backend/src/routes/authRoutes.ts
import express from "express";
import { login, logout, checkAuth } from "../controllers/authController";
import { authenticateUser } from "../middlewares/authMiddleware";

const router = express.Router();

// Public routes
router.post("/login", login);
router.post("/logout", logout);

// Protected route - requires authentication
router.get("/check", authenticateUser, checkAuth);

export default router;