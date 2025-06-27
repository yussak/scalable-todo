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
  let testUser: any;

  // 各テスト前にデータクリアとテストユーザー作成
  beforeEach(async () => {
    await testPrisma.todo.deleteMany();
    // 既存のテストユーザーを使用（ID: 1）
    testUser = { id: 1 };
  });
  it("should create a new todo successfully", async () => {
    const newTodo = {
      title: "Test Todo",
      description: "Test description",
      userId: testUser.id,
    };

    const response = await request(app).post("/api/todos").send(newTodo);

    expect(response.status).toBe(201);

    expect(response.body).toMatchObject({
      id: expect.any(Number),
      title: "Test Todo",
      description: "Test description",
      completed: false,
      userId: testUser.id,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      user: expect.objectContaining({
        id: testUser.id,
        email: "test@example.com",
      }),
    });

    const savedTodo = await testPrisma.todo.findUnique({
      where: { id: response.body.id },
    });

    expect(savedTodo).toMatchObject({
      title: "Test Todo",
      description: "Test description",
      completed: false,
      userId: testUser.id,
    });
  });
});

describe("GET /api/todos", () => {
  let testUser: any;

  beforeEach(async () => {
    await testPrisma.todo.deleteMany();
    // 既存のテストユーザーを使用（ID: 1）
    testUser = { id: 1 };
  });

  it("should return empty array when no todos exist", async () => {
    const response = await request(app).get(`/api/todos?userId=${testUser.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("should return all todos when multiple todos exist", async () => {
    // テストデータを作成
    const testTodos = [
      {
        title: "Todo 1",
        description: "Description 1",
        completed: false,
        userId: testUser.id,
      },
      {
        title: "Todo 2",
        description: "Description 2",
        completed: true,
        userId: testUser.id,
      },
      {
        title: "Todo 3",
        description: "Description 3",
        completed: false,
        userId: testUser.id,
      },
    ];

    await testPrisma.todo.createMany({
      data: testTodos,
    });

    const response = await request(app).get(`/api/todos?userId=${testUser.id}`);

    expect(response.status).toBe(200);

    // 3件のTodoが返されることを確認
    expect(response.body).toHaveLength(3);

    // 各Todoの内容を確認
    response.body.forEach((todo: any, index: number) => {
      expect(todo).toMatchObject({
        id: expect.any(Number),
        title: testTodos[index].title,
        description: testTodos[index].description,
        completed: testTodos[index].completed,
        userId: testUser.id,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        user: expect.objectContaining({
          id: testUser.id,
          email: "test@example.com",
        }),
      });
    });
  });
});

describe("DELETE /api/todos/:id", () => {
  let testUser: any;

  beforeEach(async () => {
    await testPrisma.todo.deleteMany();
    // 既存のテストユーザーを使用（ID: 1）
    testUser = { id: 1 };
  });

  it("should return 404 when todo not found", async () => {
    const response = await request(app)
      .delete("/api/todos/999")
      .send({ userId: testUser.id });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Todo not found" });
  });

  it("should delete todo", async () => {
    // テストデータを作成
    const testTodos = [
      {
        title: "Todo 1",
        description: "Description 1",
        completed: false,
        userId: testUser.id,
      },
      {
        title: "Todo 2",
        description: "Description 2",
        completed: true,
        userId: testUser.id,
      },
      {
        title: "Todo 3",
        description: "Description 3",
        completed: false,
        userId: testUser.id,
      },
    ];

    const createdTodos = await Promise.all(
      testTodos.map((todo) => testPrisma.todo.create({ data: todo }))
    );

    const response = await request(app)
      .delete(`/api/todos/${createdTodos[1].id}`)
      .send({ userId: testUser.id });

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });
});

describe("PUT /api/todos/:id", () => {
  let testUser: any;

  beforeEach(async () => {
    await testPrisma.todo.deleteMany();
    // 既存のテストユーザーを使用（ID: 1）
    testUser = { id: 1 };
  });

  it("should return 404 when todo not found", async () => {
    const updateData = {
      title: "Updated Todo",
      description: "Updated Description",
      completed: true,
      userId: testUser.id,
    };

    const response = await request(app).put("/api/todos/999").send(updateData);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Todo not found" });
  });

  it("should return 400 when title is empty", async () => {
    const createdTodo = await testPrisma.todo.create({
      data: {
        title: "Original Todo",
        description: "Original Description",
        userId: testUser.id,
      },
    });

    const response = await request(app)
      .put(`/api/todos/${createdTodo.id}`)
      .send({
        title: "",
        description: "Updated Description",
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Title is required" });
  });

  it("should update a todo successfully", async () => {
    const createdTodo = await testPrisma.todo.create({
      data: {
        title: "Original Todo",
        description: "Original Description",
        completed: false,
        userId: testUser.id,
      },
    });

    const updateData = {
      title: "Updated Todo",
      description: "Updated Description",
      completed: true,
      userId: testUser.id,
    };

    const response = await request(app)
      .put(`/api/todos/${createdTodo.id}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: createdTodo.id,
      title: "Updated Todo",
      description: "Updated Description",
      completed: true,
    });

    const savedTodo = await testPrisma.todo.findUnique({
      where: { id: createdTodo.id },
    });

    expect(savedTodo).toMatchObject({
      title: "Updated Todo",
      description: "Updated Description",
      completed: true,
    });
  });
});
