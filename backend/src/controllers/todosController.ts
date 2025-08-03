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
}
