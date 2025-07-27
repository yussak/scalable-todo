import { Request, Response } from "express";
import prisma from "../prisma.js";

export class TodosController {
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

      const userIdNum = parseInt(userId as string, 10);
      if (isNaN(userIdNum)) {
        res.status(400).json({ error: "Invalid userId" });
        return;
      }

      const todos = await prisma.todo.findMany({
        where: { userId: userIdNum },
        include: { user: true },
        orderBy: { createdAt: "desc" },
      });
      res.json(todos);
    } catch (error) {
      console.error("Error fetching todos:", error);
      res.status(500).json({ error: "Failed to fetch todos" });
    }
  }

  async getTodoById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.query;

      if (
        userId == null ||
        typeof userId !== "string" ||
        userId.trim().length === 0
      ) {
        res.status(400).json({ error: "userId is required" });
        return;
      }

      const todoId = parseInt(id, 10);
      const userIdNum = parseInt(userId as string, 10);

      if (isNaN(todoId)) {
        res.status(400).json({ error: "Invalid todo ID" });
        return;
      }

      if (isNaN(userIdNum)) {
        res.status(400).json({ error: "Invalid userId" });
        return;
      }

      const todo = await prisma.todo.findFirst({
        where: {
          id: todoId,
          userId: userIdNum,
        },
        include: { user: true },
      });

      if (todo == null) {
        res.status(404).json({ error: "Todo not found" });
        return;
      }

      res.json(todo);
    } catch (error) {
      console.error("Error fetching todo:", error);
      res.status(500).json({ error: "Failed to fetch todo" });
    }
  }

  async createTodo(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, userId } = req.body;

      if (title == null || title.trim().length === 0) {
        res.status(400).json({ error: "Title is required" });
        return;
      }

      if (
        userId == null ||
        typeof userId !== "string" ||
        userId.trim().length === 0
      ) {
        res.status(400).json({ error: "userId is required" });
        return;
      }

      const userIdNum = parseInt(userId, 10);
      if (isNaN(userIdNum)) {
        res.status(400).json({ error: "Invalid userId" });
        return;
      }

      const todo = await prisma.todo.create({
        data: {
          title,
          description: description || null,
          userId: userIdNum,
        },
        include: { user: true },
      });

      res.status(201).json(todo);
    } catch (error) {
      console.error("Error creating todo:", error);
      res.status(500).json({ error: "Failed to create todo" });
    }
  }
}
