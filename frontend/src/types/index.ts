// frontend/src/types/index.ts
export interface Company {
    suppuserid: string | number;
    SUP_NAME: string;
    SUP_Address1: string;
    SUP_Town: string;
    SUP_Phone: string;
    SUP_Email: string;
    SUP_Website: string;
    date_prequal: string;
    BIDDER_NUMBER: string;
    [key: string]: any; // For additional fields
  }

  export interface DuplicateEntry {
    company: Company;
    message: string;
  }
  
  export interface InsertResult {
    success: boolean;
    results: {
      inserted: number;
      duplicates: number;
      errors: number;
    };
    details: {
      inserted: Array<{ company: Company; insertId: number | string }>;
      duplicates: Array<DuplicateEntry>;
      errors: Array<{ company: Company; error: string }>;
    };
  }