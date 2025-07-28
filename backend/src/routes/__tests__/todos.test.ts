import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import prisma from "../../prisma";
import todoRoutes from "../todos";
import { Todo, User } from "@prisma/client";

const app = express();
app.use(express.json());
app.use("/api/todos", todoRoutes);

// 全体で共通のテストユーザー
let testUser: User;

beforeEach(async () => {
  await prisma.todo.deleteMany();
  await prisma.user.deleteMany();

  const timestamp = Date.now();
  testUser = await prisma.user.create({
    data: {
      email: `testuser-${timestamp}@example.test`,
      password: "hashedPassword123",
    },
  });
});

describe("POST /api/todos", () => {
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
        email: testUser.email,
      }),
    });

    const savedTodo = await prisma.todo.findUnique({
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

    await prisma.todo.createMany({
      data: testTodos,
    });

    const response = await request(app).get(`/api/todos?userId=${testUser.id}`);

    expect(response.status).toBe(200);

    // 3件のTodoが返されることを確認
    expect(response.body).toHaveLength(3);

    // 各Todoの内容を確認
    response.body.forEach((todo: Todo, index: number) => {
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
          email: testUser.email,
        }),
      });
    });
  });
});

describe("DELETE /api/todos/:id", () => {
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
      testTodos.map((todo) => prisma.todo.create({ data: todo }))
    );

    const response = await request(app)
      .delete(`/api/todos/${createdTodos[1].id}`)
      .send({ userId: testUser.id });

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });
});

describe("GET /api/todos/:id", () => {
  it("should return 404 when todo not found", async () => {
    const response = await request(app).get(
      `/api/todos/999?userId=${testUser.id}`
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Todo not found" });
  });

  it("should return 400 when userId is not provided", async () => {
    const response = await request(app).get("/api/todos/1");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "userId is required" });
  });

  it("should return 400 when todo ID is invalid", async () => {
    const response = await request(app).get(
      `/api/todos/invalid?userId=${testUser.id}`
    );

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Invalid todo ID" });
  });

  it("should return 400 when userId is invalid", async () => {
    const response = await request(app).get("/api/todos/1?userId=invalid");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Invalid userId" });
  });

  it("should return a specific todo when it exists", async () => {
    const createdTodo = await prisma.todo.create({
      data: {
        title: "Test Todo",
        description: "Test Description",
        completed: false,
        userId: testUser.id,
      },
    });

    const response = await request(app).get(
      `/api/todos/${createdTodo.id}?userId=${testUser.id}`
    );

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: createdTodo.id,
      title: "Test Todo",
      description: "Test Description",
      completed: false,
      userId: testUser.id,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      user: expect.objectContaining({
        id: testUser.id,
        email: testUser.email,
      }),
    });
  });

  it("should return 404 when todo belongs to different user", async () => {
    const anotherUser = await prisma.user.create({
      data: {
        email: `another-${Date.now()}@example.test`,
        password: "hashedPassword123",
      },
    });

    const createdTodo = await prisma.todo.create({
      data: {
        title: "Another User Todo",
        description: "Description",
        userId: anotherUser.id,
      },
    });

    const response = await request(app).get(
      `/api/todos/${createdTodo.id}?userId=${testUser.id}`
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Todo not found" });
  });
});

describe("PUT /api/todos/:id", () => {
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
    const createdTodo = await prisma.todo.create({
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
    const createdTodo = await prisma.todo.create({
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

    const savedTodo = await prisma.todo.findUnique({
      where: { id: createdTodo.id },
    });

    expect(savedTodo).toMatchObject({
      title: "Updated Todo",
      description: "Updated Description",
      completed: true,
    });
  });
});
