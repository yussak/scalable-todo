import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import todoRoutes from "../src/routes/todos.js";
import prisma from "../src/prisma.js";

const app = express();
app.use(express.json());
app.use("/api/todos", todoRoutes);

let testUser: any;
let testTodo: any;

beforeEach(async () => {
  // テストデータクリーンアップ
  await prisma.comment.deleteMany();
  await prisma.todo.deleteMany();
  await prisma.user.deleteMany();

  // テスト用ユーザー作成
  const timestamp = Date.now();
  testUser = await prisma.user.create({
    data: {
      email: `testuser-${timestamp}@example.test`,
      password: "hashedPassword123",
    },
  });

  // テスト用Todo作成
  testTodo = await prisma.todo.create({
    data: {
      title: "Test Todo",
      description: "Test description",
      userId: testUser.id,
    },
  });
});

describe("POST /api/todos/:todoId/comments", () => {
  it("should create a new comment", async () => {
    const response = await request(app)
      .post(`/api/todos/${testTodo.id}/comments`)
      .send({ content: "This is a test comment" })
      .expect(201);

    expect(response.body.content).toBe("This is a test comment");
    expect(response.body.todoId).toBe(testTodo.id);
  });
});
