import { Request, Response } from "express";
import { jqsPool } from "../config/db";
import { generateToken } from "../utils/token";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const [rows]: any = await jqsPool.query(
      "SELECT login, email, pswd FROM sec_njqs_users WHERE email = ? AND pswd = ?",
      [email, password]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    const user = rows[0];
    const token = generateToken(user.login);
    
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000
    });
    
    return res.json({ message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
};