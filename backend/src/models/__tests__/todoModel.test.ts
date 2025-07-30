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
    const mockUserId = "550e8400-e29b-41d4-a716-446655440000";

    it("should call prisma.todo.findMany with correct parameters and return todos", async () => {
      const mockTodos = [
        {
          id: 1,
          title: "Test Todo",
          description: "Test Description",
          completed: false,
          userId: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: mockUserId,
            email: "test@example.com",
          },
        },
      ];

      (prisma.todo.findMany as any).mockResolvedValue(mockTodos);

      const result = await todoModel.getTodosByUserId(mockUserId);

      expect(prisma.todo.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        include: { user: true },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual(mockTodos);
    });

    it("should return empty array when no todos found", async () => {
      (prisma.todo.findMany as any).mockResolvedValue([]);

      const result = await todoModel.getTodosByUserId(mockUserId);

      expect(result).toEqual([]);
    });

    it("should throw error when database error occurs", async () => {
      const dbError = new Error("Database connection failed");
      (prisma.todo.findMany as any).mockRejectedValue(dbError);

      await expect(todoModel.getTodosByUserId(mockUserId)).rejects.toThrow(
        "Database connection failed"
      );
    });
  });
});
