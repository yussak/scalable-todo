import { Router, Request, Response } from "express";
import { TodosController } from "../controllers/todosController.js";
import { TodosFuncController } from "../controllers/todosFuncController.js";

const router = Router();
const todosController = new TodosController();

router.get("/", (req: Request, res: Response) =>
  todosController.getTodos(req, res)
);

router.get("/:id", (req: Request, res: Response) =>
  TodosFuncController.getTodoById(req, res)
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
