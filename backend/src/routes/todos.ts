import { Router, Request, Response } from "express";
import prisma from "../prisma.js";
import { TodosController } from "../controllers/todosController.js";

// Helper function for todo ID validation and existence check
async function validateAndGetTodo(
  todoIdParam: string,
  res: Response
): Promise<{ todoId: number; todo: { id: number; userId: number } } | null> {
  const todoId = parseInt(todoIdParam, 10);

  if (isNaN(todoId)) {
    return null;
  }

  const todo = await prisma.todo.findUnique({
    where: { id: todoId },
  });

  if (todo == null) {
    return null;
  }

  return { todoId, todo };
}

const router = Router();
const todosController = new TodosController();

router.get("/", (req: Request, res: Response) =>
  todosController.getTodos(req, res)
);

router.get("/:id", (req: Request, res: Response) =>
  todosController.getTodoById(req, res)
);

router.post("/", async (req: Request, res: Response): Promise<void> => {
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

    if (title == null || title.trim().length === 0) {
      res.status(400).json({ error: "Title is required" });
      return;
    }

    // todo:他のところもintのままで良さそうなので確認
    if (userId == null || typeof userId !== "number") {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    const updatedTodo = await prisma.todo.update({
      where: { id: todoId, userId: userId },
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

    await prisma.todo.delete({
      where: { id: todoId, userId: userIdNum },
    });

    const remainingTodos = await prisma.todo.findMany({
      where: { userId: userIdNum },
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
});

router.post(
  "/:id/comments",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { content } = req.body;

      if (content == null || content.trim().length === 0) {
        res.status(400).json({ error: "Content is required" });
        return;
      }

      const validation = await validateAndGetTodo(id, res);
      if (validation == null) {
        res.status(400).json({ error: "Invalid todo ID or todo not found" });
        return;
      }

      const { todoId, todo } = validation;

      const comment = await prisma.comment.create({
        data: {
          content,
          todoId,
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
);

router.get(
  "/:id/comments",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const validation = await validateAndGetTodo(id, res);
      if (validation == null) {
        res.status(400).json({ error: "Invalid todo ID or todo not found" });
        return;
      }

      const { todoId } = validation;

      const comments = await prisma.comment.findMany({
        where: { todoId },
        include: { user: true },
        orderBy: { createdAt: "desc" },
      });

      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  }
);

router.delete(
  "/:id/comments/:commentId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, commentId } = req.params;

      const validation = await validateAndGetTodo(id, res);
      if (validation == null) {
        res.status(400).json({ error: "Invalid todo ID or todo not found" });
        return;
      }

      const { todoId } = validation;

      // Comment IDのバリデーション
      const commentIdNum = parseInt(commentId, 10);
      if (isNaN(commentIdNum)) {
        res.status(400).json({ error: "Invalid comment ID" });
        return;
      }

      const comment = await prisma.comment.findFirst({
        where: {
          id: commentIdNum,
          todoId,
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
);

export default router;
