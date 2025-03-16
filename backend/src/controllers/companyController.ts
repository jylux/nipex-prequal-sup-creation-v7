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
    const companies = rows.map(row => ({
      suppuserid: row.fldi_vendor_id,
      SUP_NAME: row.fldv_companyname,
      SUP_Address1: row.fldv_address,
      SUP_Phone: row.fldv_phone,
      SUP_Email: row.fldv_email_id,
      SUP_Website: row.fldv_website,
      SUP_Town: '', // Will be populated by frontend with OpenStreetMap API
      date_prequal: new Date,
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
export const insertCompanies = async (req: Request, res: Response) => {
  const companies = req.body;

  // Validate input
  if (!Array.isArray(companies)) {
    return res.status(400).json({ message: 'Companies must be an array' });
  }

  try {
    const results = {
      inserted: [] as Array<{ company: any; insertId: number | string }>,
      duplicates: [] as Array<{ company: any; message: string }>,
      errors: [] as Array<{ company: any; error: string }>
    };

    for (const company of companies) {
      try {
        // Check for duplicates by name or email
        const [existingCompanies] = await jqsPool.query<SupplierRow[]>(
          'SELECT SUP_ID FROM tblsupplier WHERE SUP_NAME = ? OR SUP_Email = ?',
          [company.SUP_NAME, company.SUP_Email]
        );
        
        if (existingCompanies.length > 0) {
          results.duplicates.push({
            company,
            message: `Duplicate entry found with ID: ${existingCompanies[0].SUP_ID}`
          });
          continue;
        }
        
        // Insert the record
        const [insertResult] = await jqsPool.query<ResultSetHeader>(
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
        
        results.inserted.push({
          company,
          insertId: insertResult.insertId
        });
      } catch (err) {
        const error = err as Error;
        results.errors.push({
          company,
          error: error.message
        });
      }
    }
    
    return res.json(results);
  } catch (err) {
    const error = err as Error;
    console.error('insertCompanies error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};