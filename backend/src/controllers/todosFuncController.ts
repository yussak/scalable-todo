import { Request, Response } from "express";
import prisma from "../prisma.js";
import { isValidUUID } from "../utils/uuid.js";

export const TodosFuncController = {
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

      const todo = await prisma.todo.create({
        data: {
          title,
          description: description || null,
          userId: userId,
        },
        include: { user: true },
      });

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

      const todo = await prisma.todo.findFirst({
        where: {
          id: id,
          userId: userId,
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
  },
};
