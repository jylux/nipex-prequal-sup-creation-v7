import express from "express";
import { searchCompanies, insertCompanies } from "../controllers/companyController";

const router = express.Router();

// Ensure `searchCompanies` and `insertCompanies` are correctly imported
router.get("/search", searchCompanies);
router.post("/insert", insertCompanies);

export default router;

