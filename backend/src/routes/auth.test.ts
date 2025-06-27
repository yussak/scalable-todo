import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { authRouter } from "./auth";
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

// bcryptのモック
vi.mock("bcryptjs", () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

// jwtのモック
vi.mock("jsonwebtoken", () => ({
  sign: vi.fn(),
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
      vi.mocked(bcrypt.hash).mockResolvedValue("hashedPassword" as any);
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
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
    });

    // it('既存のメールアドレスでは登録できない', async () => {
    //   const existingUser = {
    //     id: 1,
    //     email: 'existing@example.com',
    //     password: 'hashedPassword',
    //     createdAt: new Date(),
    //     updatedAt: new Date(),
    //   };

    //   vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser);

    //   const response = await request(app)
    //     .post('/api/auth/register')
    //     .send({
    //       email: 'existing@example.com',
    //       password: 'password123',
    //     });

    //   expect(response.status).toBe(400);
    //   expect(response.body).toEqual({
    //     error: 'User already exists',
    //   });
    // });

    // it('メールアドレスが不正な形式の場合はエラーを返す', async () => {
    //   const response = await request(app)
    //     .post('/api/auth/register')
    //     .send({
    //       email: 'invalid-email',
    //       password: 'password123',
    //     });

    //   expect(response.status).toBe(400);
    //   expect(response.body).toEqual({
    //     error: 'Invalid email format',
    //   });
    // });

    // it('パスワードが短すぎる場合はエラーを返す', async () => {
    //   const response = await request(app)
    //     .post('/api/auth/register')
    //     .send({
    //       email: 'test@example.com',
    //       password: '123',
    //     });

    //   expect(response.status).toBe(400);
    //   expect(response.body).toEqual({
    //     error: 'Password must be at least 6 characters',
    //   });
    // });

    // it('必須フィールドが欠けている場合はエラーを返す', async () => {
    //   const response = await request(app)
    //     .post('/api/auth/register')
    //     .send({
    //       email: 'test@example.com',
    //     });

    //   expect(response.status).toBe(400);
    //   expect(response.body).toEqual({
    //     error: 'Email and password are required',
    //   });
    // });
  });

  // describe('POST /api/auth/login', () => {
  //   it('正しい認証情報でログインできる', async () => {
  //     const mockUser = {
  //       id: 1,
  //       email: 'test@example.com',
  //       password: 'hashedPassword',
  //       createdAt: new Date(),
  //       updatedAt: new Date(),
  //     };

  //     vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
  //     vi.mocked(bcrypt.compare).mockResolvedValue(true);
  //     vi.mocked(jwt.sign).mockReturnValue('mockToken');

  //     const response = await request(app)
  //       .post('/api/auth/login')
  //       .send({
  //         email: 'test@example.com',
  //         password: 'password123',
  //       });

  //     expect(response.status).toBe(200);
  //     expect(response.body).toEqual({
  //       message: 'Login successful',
  //       user: {
  //         id: mockUser.id,
  //         email: mockUser.email,
  //       },
  //       token: 'mockToken',
  //     });
  //     expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
  //   });

  //   it('存在しないユーザーではログインできない', async () => {
  //     vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

  //     const response = await request(app)
  //       .post('/api/auth/login')
  //       .send({
  //         email: 'nonexistent@example.com',
  //         password: 'password123',
  //       });

  //     expect(response.status).toBe(401);
  //     expect(response.body).toEqual({
  //       error: 'Invalid credentials',
  //     });
  //   });

  //   it('間違ったパスワードではログインできない', async () => {
  //     const mockUser = {
  //       id: 1,
  //       email: 'test@example.com',
  //       password: 'hashedPassword',
  //       createdAt: new Date(),
  //       updatedAt: new Date(),
  //     };

  //     vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
  //     vi.mocked(bcrypt.compare).mockResolvedValue(false);

  //     const response = await request(app)
  //       .post('/api/auth/login')
  //       .send({
  //         email: 'test@example.com',
  //         password: 'wrongpassword',
  //       });

  //     expect(response.status).toBe(401);
  //     expect(response.body).toEqual({
  //       error: 'Invalid credentials',
  //     });
  //   });

  //   it('必須フィールドが欠けている場合はエラーを返す', async () => {
  //     const response = await request(app)
  //       .post('/api/auth/login')
  //       .send({
  //         email: 'test@example.com',
  //       });

  //     expect(response.status).toBe(400);
  //     expect(response.body).toEqual({
  //       error: 'Email and password are required',
  //     });
  //   });
  // });

  // describe('認証ミドルウェア', () => {
  //   it('有効なトークンでリクエストが通る', async () => {
  //     const mockUser = {
  //       id: 1,
  //       email: 'test@example.com',
  //     };

  //     vi.mocked(jwt.verify).mockReturnValue({ userId: 1 });
  //     vi.mocked(prisma.user.findUnique).mockResolvedValue({
  //       ...mockUser,
  //       password: 'hashedPassword',
  //       createdAt: new Date(),
  //       updatedAt: new Date(),
  //     });

  //     // 認証が必要なエンドポイントのテスト
  //     app.get('/api/auth/me', authenticateToken, async (req, res) => {
  //       res.json({ user: req.user });
  //     });

  //     const response = await request(app)
  //       .get('/api/auth/me')
  //       .set('Authorization', 'Bearer validToken');

  //     expect(response.status).toBe(200);
  //     expect(response.body.user).toEqual(mockUser);
  //   });

  //   it('トークンがない場合は401エラー', async () => {
  //     app.get('/api/auth/me', authenticateToken, async (req, res) => {
  //       res.json({ user: req.user });
  //     });

  //     const response = await request(app)
  //       .get('/api/auth/me');

  //     expect(response.status).toBe(401);
  //     expect(response.body).toEqual({
  //       error: 'Access token required',
  //     });
  //   });

  //   it('無効なトークンの場合は403エラー', async () => {
  //     vi.mocked(jwt.verify).mockImplementation(() => {
  //       throw new Error('Invalid token');
  //     });

  //     app.get('/api/auth/me', authenticateToken, async (req, res) => {
  //       res.json({ user: req.user });
  //     });

  //     const response = await request(app)
  //       .get('/api/auth/me')
  //       .set('Authorization', 'Bearer invalidToken');

  //     expect(response.status).toBe(403);
  //     expect(response.body).toEqual({
  //       error: 'Invalid or expired token',
  //     });
  //   });
  // });
});
