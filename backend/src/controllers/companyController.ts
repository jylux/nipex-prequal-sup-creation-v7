// backend/src/controllers/companyController.ts

import { Request, Response } from 'express';
import { jqsPool } from '../config/db';
import { livePool } from '../config/db';
import { parseAddress } from '../utils/addressParser';
import * as XLSX from 'xlsx';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// Define interfaces for your database rows
interface CompanyRow extends RowDataPacket {
  fldi_company_id: number | string;
  fldv_companyname: string;
  fldi_vendor_id: string;
  fldv_address: string;
  fldv_phonenumber?: string;
  fldv_email?: string;
  fldv_website?: string;
  date_prequal?: string;
}

interface SupplierRow extends RowDataPacket {
  SUP_ID: number;
  SUP_NAME: string;
  SUP_Email: string;
  // Add other fields as needed
}

/**
 * GET /companies/search?query=...
 * Searches companies in tbl_company_mst by name.
 * Excludes those whose fldi_vendor_id is purely numeric.
 * Returns up to 20 results.
 */
export const searchCompanies = async (req: Request, res: Response) => {
  const { query } = req.query;

  // Validate query
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ message: 'Missing or invalid query parameter' });
  }

  try {
    // Modified SQL to exclude numeric vendor IDs directly in the query
    const sql = `
      SELECT fldv_companyname, fldi_vendor_id, fldv_address, 
             fldv_phone, fldv_email_id, fldv_website
      FROM tbl_company_mst
      WHERE fldv_companyname LIKE ?
      AND fldi_vendor_id NOT REGEXP '^[0-9]+$'
      LIMIT 20
    `;
    
    const [rows] = await livePool.query<CompanyRow[]>(sql, [`%${query}%`]);

    // Map DB columns to frontend expected format
    const date_prequal = new Date().toLocaleDateString('en-CA');
    const companies = rows.map(row => ({
      suppuserid: row.fldi_vendor_id,
      SUP_NAME: row.fldv_companyname,
      SUP_Address1: row.fldv_address,
      SUP_Phone: row.fldv_phone,
      SUP_Email: row.fldv_email_id,
      SUP_Website: row.fldv_website,
      SUP_Town: '', // Will be populated by frontend with OpenStreetMap API
      date_prequal,
      BIDDER_NUMBER: '', // Will be populated by frontend
      fldi_vendor_id: row.fldi_vendor_id, // Keeping original ID for reference
    }));

    return res.json(companies);
  } catch (error) {
    console.error('searchCompanies error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


/**
 * POST /companies/export/excel
 * Exports selected companies to Excel format with specific formatting
 */
export const exportExcel = async (req: Request, res: Response) => {
  try {
    const { companies, bidderStartNumber } = req.body;
    const numericStart = parseInt(bidderStartNumber, 10) || 0;
    const BID_LEN = 10;
    
    if (!Array.isArray(companies)) {
      return res.status(400).json({ message: 'Companies must be an array' });
    }
    
    // Process data into the specific format required
    const processedData = companies.map((company, index) => {
      let finalBidNum = company.BIDDER_NUMBER;
      if (!finalBidNum) {
        finalBidNum = (numericStart + index * 2)
          .toString()
          .padStart(BID_LEN, '0');
      } else {
        finalBidNum = finalBidNum.padStart(BID_LEN, '0').slice(0, BID_LEN);
      }
      
      return [
        'bbp001',
        company.SUP_NAME,
        company.SUP_NAME,
        'EN',
        'NG',
        company.SUP_Phone,
        'NG',
        company.SUP_Email,
        company.SUP_Town || 'LAGOS',
        '0002',
        company.SUP_NAME,
        company.SUP_NAME,
        'EN',
        'X',
        company.suppuserid,
        '50004066',
      ];
    });
    
  
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([...processedData]);
    
    // Apply formatting (headers bold)
    const range = XLSX.utils.decode_range(ws['!ref'] || '');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[cell]) continue;
      ws[cell].s = { font: { bold: true } };
    }
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Suppliers');
    
    // Write to buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    // Set headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename="suppliers.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // Send the file
    return res.send(buf);
  } catch (error) {
    console.error('exportExcel error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * POST /companies/export/text
 * Exports selected companies to tab-delimited text format with specific formatting
 */
export const exportText = async (req: Request, res: Response) => {
  try {
    const { companies, bidderStartNumber } = req.body;
    const numericStart = parseInt(bidderStartNumber, 10) || 0;
    const BID_LEN = 10;
    
    if (!Array.isArray(companies)) {
      return res.status(400).json({ message: 'Companies must be an array' });
    }
    
    // Process data into the specific format required and create tab-delimited lines
    const lines = companies.map((company, index) => {
      let finalBidNum = company.BIDDER_NUMBER;
      if (!finalBidNum) {
        finalBidNum = (numericStart + index * 2)
          .toString()
          .padStart(BID_LEN, '0');
      } else {
        finalBidNum = finalBidNum.padStart(BID_LEN, '0').slice(0, BID_LEN);
      }
      
      const fields = [
        'bbp001',
        company.SUP_NAME,
        company.SUP_NAME,
        'EN',
        'NG',
        company.SUP_Phone,
        'NG',
        company.SUP_Email,
        company.SUP_Town || 'LAGOS',
        '0002',
        company.SUP_NAME,
        company.SUP_NAME,
        'EN',
        'X',
        company.suppuserid,
        '50004066',
      ];
      
      return fields.join('\t');
    });
    
    
    const content = [...lines].join('\n');
    
    // Set headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename="suppliers.txt"');
    res.setHeader('Content-Type', 'text/plain');
    
    // Send the file
    return res.send(content);
  } catch (error) {
    console.error('exportText error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * POST /companies/insert
 * Inserts records into tblsupplier table in nipexjqs database.
 * Checks for duplicates before insertion.
 */
/**
 * POST /companies/insert
 * Inserts records into tblsupplier table in nipexjqs database.
 * Relies on database constraints to catch duplicate suppuserid values.
 */
/**
 * POST /companies/insert
 * Inserts records into tblsupplier table in nipexjqs database.
 */
export const insertCompanies = async (req: Request, res: Response) => {
  const companies = req.body;

  // Validate input
  if (!Array.isArray(companies)) {
    return res.status(400).json({ message: 'Companies must be an array' });
  }

  try {
    // Insert companies one by one to catch duplicates
    for (const company of companies) {
      try {
        await jqsPool.query(
          `INSERT INTO tblsupplier (
            suppuserid, SUP_NAME, SUP_Address1, SUP_Town, 
            SUP_Phone, SUP_Email, SUP_Website, date_prequal, BIDDER_NUMBER
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            company.suppuserid,
            company.SUP_NAME,
            company.SUP_Address1,
            company.SUP_Town,
            company.SUP_Phone,
            company.SUP_Email,
            company.SUP_Website,
            company.date_prequal,
            company.BIDDER_NUMBER
          ]
        );
      } catch (err: any) {
        // If duplicate entry is found, return a specific error
        // If duplicate entry is found, return a specific error
if (err.code === 'ER_DUP_ENTRY') {
  const duplicateIdMatch = err.message.match(/Duplicate entry '(.+)' for key/);
  const duplicateId = duplicateIdMatch ? duplicateIdMatch[1] : null;
  
  if (duplicateId) {
    // Find the company name to include in the error
    const companyName = company.SUP_NAME || 'Unknown company';
    
    return res.status(409).json({
      error: 'DUPLICATE_ENTRY',
      duplicateId,
      companyName, // Include the company name
      message: `Duplicate entry found: "${companyName}" (ID: ${duplicateId}). Please remove this entry and try again.`
    });
  } else {
    return res.status(409).json({
      error: 'DUPLICATE_ENTRY',
      message: 'A duplicate entry was found, but the specific ID could not be determined.'
    });
  }
}
        
        // For any other error, throw it to be caught by the outer catch
        throw err;
      }
    }
    
    // If all inserts succeeded
    return res.json({ success: true });
    
  } catch (error: any) {
    console.error('insertCompanies error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};