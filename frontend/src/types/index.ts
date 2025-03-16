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