import { Request, Response } from "express";
import prisma from "../prisma.js";
import { TodoModel, ITodoModel } from "../models/todoModel.js";
import { isValidUUID } from "../utils/uuid.js";

export class TodosController {
  private todoModel: ITodoModel;

  // 依存性注入パターンでTodoModelを受け取る
  constructor(todoModel?: ITodoModel) {
    this.todoModel = todoModel ?? new TodoModel();
  }

  async getTodos(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.query;

      if (userId == null) {
        res.status(400).json({ error: "userId is required" });
        return;
      }

      if (typeof userId !== "string") {
        res.status(400).json({ error: "userId must be a string" });
        return;
      }

      if (userId.trim().length === 0) {
        res.status(400).json({ error: "userId must not be empty" });
        return;
      }

      const todos = await this.todoModel.getTodosByUserId(userId);

      res.json(todos);
    } catch (error) {
      console.error("Error fetching todos:", error);
      res.status(500).json({ error: "Failed to fetch todos" });
    }
  }

  async updateTodo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, description, completed, userId } = req.body;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: "Invalid todo ID" });
        return;
      }

      if (title == null) {
        res.status(400).json({ error: "Title is required" });
        return;
      }

      if (typeof title !== "string") {
        res.status(400).json({ error: "Title must be a string" });
        return;
      }

      if (title.trim().length === 0) {
        res.status(400).json({ error: "Title is required" });
        return;
      }

      if (userId == null) {
        res.status(400).json({ error: "userId is required" });
        return;
      }

      if (typeof userId !== "string") {
        res.status(400).json({ error: "userId must be a string" });
        return;
      }

      if (userId.trim().length === 0) {
        res.status(400).json({ error: "userId must not be empty" });
        return;
      }

      const updatedTodo = await prisma.todo.update({
        where: { id: id, userId: userId },
        data: {
          title: title.trim(),
          description: description !== undefined ? description : undefined,
          completed: completed !== undefined ? completed : undefined,
        },
        include: { user: true },
      });

      res.json(updatedTodo);
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2025"
      ) {
        res.status(404).json({ error: "Todo not found" });
      } else {
        console.error("Error updating todo:", error);
        res.status(500).json({ error: "Failed to update todo" });
      }
    }
  }

  async deleteTodo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: "Invalid todo ID" });
        return;
      }

      if (userId == null || typeof userId !== "string") {
        res.status(400).json({ error: "userId is required" });
        return;
      }

      await prisma.todo.delete({
        where: { id: id, userId: userId },
      });

      const remainingTodos = await prisma.todo.findMany({
        where: { userId: userId },
        include: { user: true },
        orderBy: { createdAt: "desc" },
      });

      res.json(remainingTodos);
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2025"
      ) {
        res.status(404).json({ error: "Todo not found" });
      } else {
        console.error("Error deleting todo:", error);
        res.status(500).json({ error: "Failed to delete todo" });
      }
    }
  }

  async createComment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { content } = req.body;

      if (content == null) {
        res.status(400).json({ error: "Content is required" });
        return;
      }

      if (typeof content !== "string") {
        res.status(400).json({ error: "Content must be a string" });
        return;
      }

      if (content.trim().length === 0) {
        res.status(400).json({ error: "Content is required" });
        return;
      }

      if (!isValidUUID(id)) {
        res.status(400).json({ error: "Invalid todo ID or todo not found" });
        return;
      }

      const todo = await prisma.todo.findUnique({
        where: { id: id },
      });

      if (todo == null) {
        res.status(400).json({ error: "Invalid todo ID or todo not found" });
        return;
      }

      const comment = await prisma.comment.create({
        data: {
          content,
          todoId: id,
          userId: todo.userId,
        },
        include: { user: true },
      });

      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  }

  async getComments(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: "Invalid todo ID" });
        return;
      }

      const todo = await prisma.todo.findUnique({
        where: { id: id },
      });

      if (todo == null) {
        res.status(404).json({ error: "Todo not found" });
        return;
      }

      const comments = await prisma.comment.findMany({
        where: { todoId: id },
        include: { user: true },
        orderBy: { createdAt: "desc" },
      });

      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  }

  async deleteComment(req: Request, res: Response): Promise<void> {
    try {
      const { id, commentId } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: "Invalid todo ID" });
        return;
      }

      const todo = await prisma.todo.findUnique({
        where: { id: id },
      });

      if (todo == null) {
        res.status(404).json({ error: "Todo not found" });
        return;
      }

      const commentIdNum = parseInt(commentId, 10);
      if (isNaN(commentIdNum)) {
        res.status(400).json({ error: "Invalid comment ID" });
        return;
      }

      const comment = await prisma.comment.findFirst({
        where: {
          id: commentIdNum,
          todoId: id,
        },
      });

      if (comment == null) {
        res.status(404).json({ error: "Comment not found" });
        return;
      }

      await prisma.comment.delete({
        where: { id: commentIdNum },
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  }
}
