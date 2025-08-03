import { Router, Request, Response } from "express";
import { todosController } from "../controllers/todosController.js";

const router = Router();

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

router.delete("/:id/comments/:commentId", (req: Request, res: Response) =>
  todosController.deleteComment(req, res)
);

export default router;
