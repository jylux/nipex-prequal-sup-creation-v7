import mysql, { Pool } from "mysql2/promise"; 
import dotenv from "dotenv"; 
dotenv.config(); 
 
export const jqsPool: Pool = mysql.createPool({ 
  host: process.env.DB_HOST_JQS, 
  user: process.env.DB_USER_JQS, 
  password: process.env.DB_PASS_JQS, 
  database: process.env.DB_NAME_JQS, 
  waitForConnections: true, 
  connectionLimit: 10, 
}); 
 
export const livePool: Pool = mysql.createPool({ 
  host: process.env.DB_HOST_LIVE, 
  user: process.env.DB_USER_LIVE, 
  password: process.env.DB_PASS_LIVE, 
  database: process.env.DB_NAME_LIVE, 
  waitForConnections: true, 
  connectionLimit: 10, 
}); 
