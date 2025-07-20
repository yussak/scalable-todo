import prisma from "../prisma.js";

export const ReactionModel = {
  create: async (data: { todoId: number; userId: number; emoji: string }) => {
    return await prisma.reaction.create({ data });
  },

  delete: async (where: { todoId: number; userId: number; emoji: string }) => {
    return await prisma.reaction.delete({
      where: {
        todoId_userId_emoji: where,
      },
    });
  },

  findByTodo: async (todoId: number) => {
    return await prisma.reaction.findMany({
      where: { todoId },
    });
  },
};
