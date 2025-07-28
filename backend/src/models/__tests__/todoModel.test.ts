import { describe, it, expect, vi, beforeEach } from "vitest";
import { TodoModel } from "../todoModel";
import prisma from "../../prisma";

vi.mock("../../prisma", () => ({
  default: {
    todo: {
      findMany: vi.fn(),
    },
  },
}));

describe("TodoModel", () => {
  let todoModel: TodoModel;

  beforeEach(() => {
    todoModel = new TodoModel();
    vi.clearAllMocks();
  });

  describe("getTodosByUserId", () => {
    it("should call prisma.todo.findMany with correct parameters and return todos", async () => {
      const mockTodos = [
        {
          id: 1,
          title: "Test Todo",
          description: "Test Description",
          completed: false,
          userId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 1,
            email: "test@example.com",
          },
        },
      ];

      (prisma.todo.findMany as any).mockResolvedValue(mockTodos);

      const result = await todoModel.getTodosByUserId(1);

      expect(prisma.todo.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: { user: true },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual(mockTodos);
    });

    it("should return empty array when no todos found", async () => {
      (prisma.todo.findMany as any).mockResolvedValue([]);

      const result = await todoModel.getTodosByUserId(1);

      expect(result).toEqual([]);
    });

    it("should throw error when database error occurs", async () => {
      const dbError = new Error("Database connection failed");
      (prisma.todo.findMany as any).mockRejectedValue(dbError);

      await expect(todoModel.getTodosByUserId(1)).rejects.toThrow(
        "Database connection failed"
      );
    });
  });
});
