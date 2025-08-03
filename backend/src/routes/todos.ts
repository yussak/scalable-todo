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
  TodosFuncController.createTodo(req, res)
);

router.put("/:id", (req: Request, res: Response) =>
  TodosFuncController.updateTodo(req, res)
);

router.delete("/:id", (req: Request, res: Response) =>
  TodosFuncController.deleteTodo(req, res)
);

router.post("/:id/comments", (req: Request, res: Response) =>
  TodosFuncController.createComment(req, res)
);

router.get("/:id/comments", (req: Request, res: Response) =>
  TodosFuncController.getComments(req, res)
);

router.delete("/:id/comments/:commentId", (req: Request, res: Response) =>
  todosController.deleteComment(req, res)
);

export default router;
