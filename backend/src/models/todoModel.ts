import prisma from "../prisma.js";
import { Todo, User } from "@prisma/client";

// 依存性注入とテスト時のモック作成のために定義
export interface ITodoModel {
  getTodosByUserId(userId: string): Promise<TodoWithUser[]>;
}

// TodoとUserをJOINした結果の型定義
export type TodoWithUser = Todo & {
  user: User;
};

export class TodoModel implements ITodoModel {
  async getTodosByUserId(userId: string): Promise<TodoWithUser[]> {
    return await prisma.todo.findMany({
      where: { userId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
  }
}
