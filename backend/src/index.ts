// backend/src/index.ts
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import companyRoutes from "./routes/companyRoutes";

// Load environment variables from .env file
dotenv.config();

// Create Express application
const app = express();
// const PORT = process.env.PORT || 4000; // Development
const PORT = process.env.PORT || 10000; //Production

// Configure CORS
app.use(
  cors({
    // origin: process.env.FRONTEND_URL || "http://localhost:3000",
    origin: process.env.FRONTEND_URL || "https://nipex-prequal-sup-creation-v7-1.onrender.com",
    credentials: true, // Critical for cookies to work with cross-origin requests
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(cookieParser()); // Parse cookies

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    message: "An unexpected error occurred",
    error: process.env.NODE_ENV === "production" ? null : err.message
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`- Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`- Companies API: http://localhost:${PORT}/api/companies`);
});