import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { AuthController } from "../authController.js";

// Prismaのモック
vi.mock("../../prisma", () => ({
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
  default: {
    sign: vi.fn(),
  },
}));

import prisma from "../../prisma.js";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const mockPrisma = prisma as {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
};

const mockBcrypt = bcrypt as {
  hash: ReturnType<typeof vi.fn>;
  compare: ReturnType<typeof vi.fn>;
};

const mockJwt = jwt as {
  sign: ReturnType<typeof vi.fn>;
};

describe("AuthController", () => {
  let authController: AuthController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    authController = new AuthController();
    req = {
      body: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("register", () => {
    it("should return 400 when email is missing", async () => {
      req.body = { password: "password123" };

      await authController.register(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Email and password are required",
      });
    });

    it("should return 400 when password is missing", async () => {
      req.body = { email: "test@example.com" };

      await authController.register(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Email and password are required",
      });
    });

    it("should return 400 when both email and password are missing", async () => {
      req.body = {};

      await authController.register(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Email and password are required",
      });
    });

    it("should return 400 when email format is invalid", async () => {
      req.body = { email: "invalid-email", password: "password123" };

      await authController.register(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid email format",
      });
    });

    it("should return 400 when password is less than 6 characters", async () => {
      req.body = { email: "test@example.com", password: "12345" };

      await authController.register(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Password must be at least 6 characters",
      });
    });

    it("should return 400 when user already exists", async () => {
      req.body = { email: "existing@example.com", password: "password123" };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: "existing@example.com",
        password: "hashedpassword",
      });

      await authController.register(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "User already exists",
      });
    });

    it("should register user successfully", async () => {
      const mockUserId = "550e8400-e29b-41d4-a716-446655440000";
      req.body = { email: "new@example.com", password: "password123" };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue("hashedpassword");
      mockPrisma.user.create.mockResolvedValue({
        id: mockUserId,
        email: "new@example.com",
        password: "hashedpassword",
      });
      mockJwt.sign.mockReturnValue("mocked-jwt-token");

      await authController.register(req as Request, res as Response);

      expect(mockBcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "new@example.com",
          password: "hashedpassword",
        },
      });
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: mockUserId },
        "secret"
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "User registered successfully",
        user: {
          id: mockUserId,
          email: "new@example.com",
        },
        token: "mocked-jwt-token",
      });
    });

    it("should return 500 when database error occurs", async () => {
      req.body = { email: "test@example.com", password: "password123" };

      mockPrisma.user.findUnique.mockRejectedValue(new Error("Database error"));

      await authController.register(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });
  });

  describe("login", () => {
    it("should return 400 when email is missing", async () => {
      req.body = { password: "password123" };

      await authController.login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Email and password are required",
      });
    });

    it("should return 400 when password is missing", async () => {
      req.body = { email: "test@example.com" };

      await authController.login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Email and password are required",
      });
    });

    it("should return 400 when both email and password are missing", async () => {
      req.body = {};

      await authController.login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Email and password are required",
      });
    });

    it("should return 401 when user does not exist", async () => {
      req.body = { email: "nonexistent@example.com", password: "password123" };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await authController.login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid credentials",
      });
    });

    it("should return 401 when password is incorrect", async () => {
      req.body = { email: "test@example.com", password: "wrongpassword" };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        password: "hashedpassword",
      });
      mockBcrypt.compare.mockResolvedValue(false);

      await authController.login(req as Request, res as Response);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        "wrongpassword",
        "hashedpassword"
      );
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid credentials",
      });
    });

    it("should login successfully with correct credentials", async () => {
      const mockUserId = "550e8400-e29b-41d4-a716-446655440000";
      req.body = { email: "test@example.com", password: "password123" };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
        email: "test@example.com",
        password: "hashedpassword",
      });
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue("mocked-jwt-token");

      await authController.login(req as Request, res as Response);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashedpassword"
      );
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: mockUserId },
        "secret"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Login successful",
        user: {
          id: mockUserId,
          email: "test@example.com",
        },
        token: "mocked-jwt-token",
      });
    });

    it("should return 500 when database error occurs", async () => {
      req.body = { email: "test@example.com", password: "password123" };

      mockPrisma.user.findUnique.mockRejectedValue(new Error("Database error"));

      await authController.login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });
  });
});
