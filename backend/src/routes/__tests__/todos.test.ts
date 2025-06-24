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

    const response = await request(app).post("/api/todos").send(newTodo);

    expect(response.status).toBe(201);

    expect(response.body).toMatchObject({
      id: expect.any(Number),
      title: "Test Todo",
      description: "Test description",
      completed: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

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

describe("GET /api/todos", () => {
  beforeEach(async () => {
    await testPrisma.todo.deleteMany();
  });

  it("should return empty array when no todos exist", async () => {
    const response = await request(app).get("/api/todos");

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
      },
      {
        title: "Todo 2",
        description: "Description 2",
        completed: true,
      },
      {
        title: "Todo 3",
        description: "Description 3",
        completed: false,
      },
    ];

    await testPrisma.todo.createMany({
      data: testTodos,
    });

    const response = await request(app).get("/api/todos");

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
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });
});

describe("DELETE /api/todos/:id", () => {
  beforeEach(async () => {
    await testPrisma.todo.deleteMany();
  });

  it("should return 404 when todo not found", async () => {
    const response = await request(app).delete("/api/todos/999");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Todo not found" });
  });

  it("should delete todo", async () => {
    // テストデータを作成
    const testTodos = [
      {
        id: 1,
        title: "Todo 1",
        description: "Description 1",
        completed: false,
      },
      {
        id: 2,
        title: "Todo 2",
        description: "Description 2",
        completed: true,
      },
      {
        id: 3,
        title: "Todo 3",
        description: "Description 3",
        completed: false,
      },
    ];

    await testPrisma.todo.createMany({
      data: testTodos,
    });

    const response = await request(app).delete("/api/todos/2");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });
});

describe("PUT /api/todos/:id", () => {
  beforeEach(async () => {
    await testPrisma.todo.deleteMany();
  });

  it("should return 404 when todo not found", async () => {
    const updateData = {
      title: "Updated Todo",
      description: "Updated Description",
      completed: true,
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
      },
    });

    const updateData = {
      title: "Updated Todo",
      description: "Updated Description",
      completed: true,
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
