import { Request, Response } from "express";
import prisma from "../prisma.js";
import { todosModel } from "../models/todoModel.js";
import { isValidUUID } from "../utils/uuid.js";

export const todosController = {
  async createTodo(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, userId } = req.body;

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

      const todo = await todosModel.createTodo(
        title,
        description || null,
        userId
      );

      res.status(201).json(todo);
    } catch (error) {
      console.error("Error creating todo:", error);
      res.status(500).json({ error: "Failed to create todo" });
    }
  },

  async getTodoById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
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

      if (!isValidUUID(id)) {
        res.status(400).json({ error: "Invalid todo ID" });
        return;
      }

      const todo = await todosModel.getTodoById(id, userId);

      if (todo == null) {
        res.status(404).json({ error: "Todo not found" });
        return;
      }

      res.json(todo);
    } catch (error) {
      console.error("Error fetching todo:", error);
      res.status(500).json({ error: "Failed to fetch todo" });
    }
  },

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
          // todo:改善
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
  },

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
  },

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
  },

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
  },

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
  },

  async getTodos(req: Request, res: Response): Promise<void> {
    try {
      const { userId, page = "1", limit = "10" } = req.query;

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

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      if (isNaN(pageNum) || pageNum < 1) {
        res.status(400).json({ error: "page must be a positive number" });
        return;
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        res.status(400).json({ error: "limit must be between 1 and 100" });
        return;
      }

      const skip = (pageNum - 1) * limitNum;

      const [todos, totalCount] = await Promise.all([
        prisma.todo.findMany({
          where: { userId },
          include: { user: true },
          orderBy: { createdAt: "desc" },
          skip,
          take: limitNum,
        }),
        prisma.todo.count({
          where: { userId },
        }),
      ]);

      const totalPages = Math.ceil(totalCount / limitNum);

      res.json({
        todos,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          limit: limitNum,
        },
      });
    } catch (error) {
      console.error("Error fetching todos:", error);
      res.status(500).json({ error: "Failed to fetch todos" });
    }
  },
};
