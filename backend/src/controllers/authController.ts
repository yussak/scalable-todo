import { Request, Response } from "express";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prisma.js";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const SALT_ROUNDS = 10;

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // 必須フィールドのチェック
      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      // メール形式のバリデーション
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: "Invalid email format" });
        return;
      }

      // パスワード長のバリデーション
      if (!password || password.length < 6) {
        res
          .status(400)
          .json({ error: "Password must be at least 6 characters" });
        return;
      }

      // 既存ユーザーのチェック
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        res.status(400).json({ error: "User already exists" });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
        },
      });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET);

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: user.id,
          email: user.email,
        },
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET);

      res.status(200).json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
        },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  }
}
