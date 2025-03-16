import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/authRoutes";  // ✅ Fix import
import companyRoutes from "./routes/companyRoutes";  // ✅ Fix import

const app = express();

// ✅ Fix CORS issue by allowing multiple origins
const allowedOrigins = ["http://localhost:3000", "http://localhost:3003"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// ✅ Attach routes correctly
app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
