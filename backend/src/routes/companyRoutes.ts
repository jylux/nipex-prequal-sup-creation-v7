// backend/src/routes/companyRoutes.ts

import express from "express";
import { 
  searchCompanies, 
  insertCompanies, 
  exportExcel,
  exportText
} from "../controllers/companyController";

const router = express.Router();

// Company search endpoint
router.get("/search", searchCompanies);

// Export endpoints
router.post("/export/excel", exportExcel);
router.post("/export/text", exportText);

// Database insertion endpoint
router.post("/insert", insertCompanies);

export default router;