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

router.post("/", (req: Request, res: Response) =>
  todosController.createTodo(req, res)
);

router.put("/:id", (req: Request, res: Response) =>
  todosController.updateTodo(req, res)
);

router.delete("/:id", (req: Request, res: Response) =>
  todosController.deleteTodo(req, res)
);

router.post("/:id/comments", (req: Request, res: Response) =>
  todosController.createComment(req, res)
);

router.get("/:id/comments", (req: Request, res: Response) =>
  todosController.getComments(req, res)
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
