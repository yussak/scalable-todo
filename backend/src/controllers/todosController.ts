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
}
