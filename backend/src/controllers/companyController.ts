// backend/src/controllers/companyController.ts

import { Request, Response } from 'express';
import { jqsPool } from '../config/db';
import { livePool } from '../config/db';
import { parseAddress } from '../utils/addressParser';

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
    // Example: MySQL syntax. Adjust for your DB engine if needed.
    const sql = `
      SELECT fldi_company_id, fldv_companyname, fldi_vendor_id, fldv_address
      FROM tbl_company_mst
      WHERE fldv_companyname LIKE ?
      LIMIT 20
    `;
    const [rows] = await livePool.query(sql, [`%${query}%`]);

    // Exclude purely numeric vendor IDs (e.g., '12345')
    const filtered = Array.isArray(rows)
      ? (rows as any[]).filter((row) => !/^\d+$/.test(row.fldi_vendor_id))
      : [];

    return res.json(filtered);
  } catch (error) {
    console.error('searchCompanies error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * POST /companies/insert
 * Expects JSON with:
 *  {
 *    "companies": [ { id, fldcompany_name, fldi_vendor_id, fldaddress, ... }, ... ],
 *    "startBidderNumber": "0000000000"
 *  }
 * Inserts records into tblsupplier, incrementing bidder number by 2 each time.
 * Also calls parseAddress to get a city/town from the address.
 */
export const insertCompanies = async (req: Request, res: Response) => {
  const { companies, startBidderNumber } = req.body;

  // Validate input
  if (!Array.isArray(companies)) {
    return res.status(400).json({ message: 'Companies must be an array' });
  }
  if (typeof startBidderNumber !== 'string' || startBidderNumber.length !== 10) {
    return res.status(400).json({ message: 'startBidderNumber must be a 10-digit string' });
  }

  try {
    let currentBidder = parseInt(startBidderNumber, 10);
    if (isNaN(currentBidder)) {
      return res.status(400).json({ message: 'startBidderNumber is not a valid number' });
    }

    for (const comp of companies) {
      // 1) Parse address to get a city/town
      const city = await parseAddress(comp.fldaddress);

      // 2) Construct the next bidder number (zero-padded to 10 digits)
      const bidderStr = currentBidder.toString().padStart(10, '0');

      // 3) Insert record into tblsupplier
      // Adjust the fields below to match your actual table schema
      await jqsPool.query(
        `INSERT INTO tblsupplier (
           suppuserid,
           SUP_NAME,
           BIDDER_NUMBER,
           SUP_Town
         ) VALUES (?, ?, ?, ?)`,
        [
          comp.fldi_company_id,
          comp.fldvcompanyname,
          bidderStr,
          city
        ]
      );

      // Increment by 2 for the next company
      currentBidder += 2;
    }

    return res.json({ message: 'Companies inserted successfully' });
  } catch (error) {
    console.error('insertCompanies error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
