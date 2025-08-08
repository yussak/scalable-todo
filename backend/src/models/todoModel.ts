import prisma from "../prisma.js";
import { Todo, User } from "@prisma/client";

export type TodoWithUser = Todo & {
  user: User;
};

export const todosModel = {
  async createTodo(
    title: string,
    description: string | null,
    userId: string
  ): Promise<TodoWithUser> {
    return await prisma.todo.create({
      data: {
        title,
        description,
        userId,
      },
      include: { user: true },
    });
  },

  async getTodoById(id: string, userId: string): Promise<TodoWithUser | null> {
    return await prisma.todo.findFirst({
      where: {
        id: id,
        userId: userId,
      },
      include: { user: true },
    });
  },
};
