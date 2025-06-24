import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

// テスト用環境変数を読み込み
dotenv.config({ path: ".env.test" });

// テスト用DBに接続
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Prismaクライアントをテスト用に置き換え
vi.mock("../../prisma", () => ({
  default: testPrisma,
}));

// モック後にルートをインポート
const todoRoutes = await import("../todos");

const app = express();
app.use(express.json());
app.use("/api/todos", todoRoutes.default);

describe("POST /api/todos", () => {
  // 各テスト前にデータクリア
  beforeEach(async () => {
    await testPrisma.todo.deleteMany();
  });
  it("should create a new todo successfully", async () => {
    const newTodo = {
      title: "Test Todo",
      description: "Test description",
    };

    const response = await request(app)
      .post("/api/todos")
      .send(newTodo)
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(Number),
      title: "Test Todo",
      description: "Test description",
      completed: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    // DBに実際に保存されているか確認
    const savedTodo = await testPrisma.todo.findUnique({
      where: { id: response.body.id },
    });

    expect(savedTodo).toMatchObject({
      title: "Test Todo",
      description: "Test description",
      completed: false,
    });
  });
});
