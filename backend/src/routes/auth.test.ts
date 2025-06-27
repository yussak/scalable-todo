import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authRouter, authenticateToken } from "./auth";
import prisma from "../prisma";

// Prismaのモック
vi.mock("../prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// jwtのモック
vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
}));

describe("Auth Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/auth", authRouter);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("新規ユーザーを正常に登録できる", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        password: "hashedPassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser);
      vi.mocked(jwt.sign).mockReturnValue("mockToken" as any);

      const response = await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: "User registered successfully",
        user: {
          id: mockUser.id,
          email: mockUser.email,
        },
        token: "mockToken",
      });
    });

    it('既存のメールアドレスでは登録できない', async () => {
      const existingUser = {
        id: 1,
        email: 'existing@example.com',
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'User already exists',
      });
    });

    it('メールアドレスが不正な形式の場合はエラーを返す', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid email format',
      });
    });

    it('パスワードが短すぎる場合はエラーを返す', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Password must be at least 6 characters',
      });
    });

    it('必須フィールドが欠けている場合はエラーを返す', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Email and password are required',
      });
    });
  });

  describe("POST /api/auth/login", () => {
    it("正しい認証情報でログインできる", async () => {
      // 実際にパスワードをハッシュ化
      const plainPassword = "password123";
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const mockUser = {
        id: 1,
        email: "test@example.com",
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(jwt.sign).mockReturnValue("mockToken" as any);

      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123", // 正しいパスワード
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Login successful",
        user: {
          id: mockUser.id,
          email: mockUser.email,
        },
        token: "mockToken",
      });
    });
  });

  it("存在しないユーザーではログインできない", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const response = await request(app).post("/api/auth/login").send({
      email: "nonexistent@example.com",
      password: "password123",
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: "Invalid credentials",
    });

    // prisma.user.findUniqueが呼ばれていることを確認
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "nonexistent@example.com" },
    });
  });

  it("間違ったパスワードではログインできない", async () => {
    // 実際にパスワードをハッシュ化
    const plainPassword = "password123";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const mockUser = {
      id: 1,
      email: "test@example.com",
      password: hashedPassword, // 実際にハッシュ化されたパスワード
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

    const response = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      // password: "password123", // 正しいパスワード
      password: "wrongpassword", // 間違ったパスワード
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: "Invalid credentials",
    });
  });

  it('必須フィールドが欠けている場合はエラーを返す', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Email and password are required',
    });
  });
  // });

  describe('認証ミドルウェア', () => {
    it('有効なトークンでリクエストが通る', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
      };

      vi.mocked(jwt.verify).mockReturnValue({ userId: 1 });
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      // 認証が必要なエンドポイントのテスト
      app.get('/api/auth/me', authenticateToken, async (req, res) => {
        res.json({ user: req.user });
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer validToken');

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual(mockUser);
    });

    it('トークンがない場合は401エラー', async () => {
      app.get('/api/auth/me', authenticateToken, async (req, res) => {
        res.json({ user: req.user });
      });

      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Access token required',
      });
    });

    it('無効なトークンの場合は403エラー', async () => {
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      app.get('/api/auth/me', authenticateToken, async (req, res) => {
        res.json({ user: req.user });
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidToken');

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: 'Invalid or expired token',
      });
    });
  });
});
