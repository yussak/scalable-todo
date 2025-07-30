import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { User, Todo } from "@prisma/client";
import todoRoutes from "../src/routes/todos.js";
import prisma from "../src/prisma.js";
import { randomUUID } from "crypto";

const app = express();
app.use(express.json());
app.use("/api/todos", todoRoutes);

let testUser: User;
let testTodo: Todo;

beforeEach(async () => {
  // テストデータクリーンアップ
  await prisma.comment.deleteMany();
  await prisma.todo.deleteMany();
  await prisma.user.deleteMany();

  // テスト用ユーザー作成
  const timestamp = Date.now();
  testUser = await prisma.user.create({
    data: {
      id: randomUUID(),
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

describe("GET /api/todos/:todoId/comments", () => {
  it("should return empty array when no comments exist", async () => {
    const response = await request(app)
      .get(`/api/todos/${testTodo.id}/comments`)
      .expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body).toHaveLength(0);
  });

  it("should return all comments for a todo with existing comments", async () => {
    // Create comments
    await request(app)
      .post(`/api/todos/${testTodo.id}/comments`)
      .send({ content: "First comment" })
      .expect(201);

    await request(app)
      .post(`/api/todos/${testTodo.id}/comments`)
      .send({ content: "Second comment" })
      .expect(201);

    const response = await request(app)
      .get(`/api/todos/${testTodo.id}/comments`)
      .expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].content).toBe("Second comment"); // Most recent first
    expect(response.body[1].content).toBe("First comment");
  });

  it("should return 404 for non-existent todo", async () => {
    await request(app).get("/api/todos/99999/comments").expect(404);
  });

  it("should return 400 for invalid todo ID", async () => {
    await request(app).get("/api/todos/invalid/comments").expect(400);
  });
});

describe("DELETE /api/todos/:todoId/comments/:commentId", () => {
  it("should delete a comment successfully", async () => {
    // Create a comment first
    const createResponse = await request(app)
      .post(`/api/todos/${testTodo.id}/comments`)
      .send({ content: "Comment to delete" })
      .expect(201);

    const commentId = createResponse.body.id;

    // Delete the comment
    await request(app)
      .delete(`/api/todos/${testTodo.id}/comments/${commentId}`)
      .expect(204);

    // Verify comment is deleted
    const getResponse = await request(app)
      .get(`/api/todos/${testTodo.id}/comments`)
      .expect(200);

    expect(getResponse.body).toHaveLength(0);
  });

  it("should return 404 for non-existent comment", async () => {
    await request(app)
      .delete(`/api/todos/${testTodo.id}/comments/99999`)
      .expect(404);
  });

  it("should return 404 for non-existent todo", async () => {
    await request(app).delete("/api/todos/99999/comments/1").expect(404);
  });

  it("should return 400 for invalid todo ID", async () => {
    await request(app).delete("/api/todos/invalid/comments/1").expect(400);
  });

  it("should return 400 for invalid comment ID", async () => {
    await request(app)
      .delete(`/api/todos/${testTodo.id}/comments/invalid`)
      .expect(400);
  });
});
