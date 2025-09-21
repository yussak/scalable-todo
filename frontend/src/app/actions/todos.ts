"use server";

import { prisma } from "@/lib/db";

export interface TodoWithUser {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
  };
}

export interface TodosResponse {
  todos: TodoWithUser[];
  hasMore: boolean;
  nextCursor?: string;
}

export async function getTodosAction(
  userId: string,
  cursor?: string,
  limit: number = 20
): Promise<TodosResponse> {
  try {
    const todos = await prisma.todo.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      take: limit + 1,
    });

    const hasMore = todos.length > limit;
    const returnTodos = hasMore ? todos.slice(0, limit) : todos;
    const nextCursor = hasMore
      ? returnTodos[returnTodos.length - 1].id
      : undefined;

    const serializedTodos = returnTodos.map((todo) => ({
      ...todo,
      createdAt: todo.createdAt.toISOString(),
      updatedAt: todo.updatedAt.toISOString(),
    }));

    return {
      todos: serializedTodos,
      hasMore,
      nextCursor,
    };
  } catch (error) {
    console.error("Error fetching todos:", error);
    throw new Error("Failed to fetch todos");
  }
}
