import { Router, Request, Response } from "express";
import prisma from "../prisma.js";

const router = Router();

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;

    if (!userId) {
      res.status(400).json({ error: "userId is required" });
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
});

router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, userId } = req.body;

    if (!title) {
      res.status(400).json({ error: "Title is required" });
      return;
    }

    if (!userId) {
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
});

router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, completed, userId } = req.body;
    const todoId = parseInt(id, 10);

    if (isNaN(todoId)) {
      res.status(400).json({ error: "Invalid todo ID" });
      return;
    }

    if (!title || title.trim() === "") {
      res.status(400).json({ error: "Title is required" });
      return;
    }

    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      res.status(400).json({ error: "Invalid userId" });
      return;
    }

    const updatedTodo = await prisma.todo.update({
      where: { id: todoId, userId: userIdNum },
      data: {
        title: title.trim(),
        description: description !== undefined ? description : undefined,
        completed: completed !== undefined ? completed : undefined,
      },
      include: { user: true },
    });

    res.json(updatedTodo);
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({ error: "Todo not found" });
    } else {
      console.error("Error updating todo:", error);
      res.status(500).json({ error: "Failed to update todo" });
    }
  }
});

router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const todoId = parseInt(id, 10);

    if (isNaN(todoId)) {
      res.status(400).json({ error: "Invalid todo ID" });
      return;
    }

    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      res.status(400).json({ error: "Invalid userId" });
      return;
    }

    await prisma.todo.delete({
      where: { id: todoId, userId: userIdNum },
    });

    const remainingTodos = await prisma.todo.findMany({
      where: { userId: userIdNum },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(remainingTodos);
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({ error: "Todo not found" });
    } else {
      console.error("Error deleting todo:", error);
      res.status(500).json({ error: "Failed to delete todo" });
    }
  }
});

export default router;
