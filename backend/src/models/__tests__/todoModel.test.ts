import { describe, it, expect, vi, beforeEach } from "vitest";
import { todosModel } from "../todoModel";
import prisma from "../../prisma";

vi.mock("../../prisma", () => ({
  default: {
    todo: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

describe("todosModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTodo", () => {
    const mockUserId = "550e8400-e29b-41d4-a716-446655440000";

    it("should call prisma.todo.create with correct parameters and return todo", async () => {
      const mockTodo = {
        id: "660e8400-e29b-41d4-a716-446655440000",
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
      };

      (prisma.todo.create as any).mockResolvedValue(mockTodo);

      const result = await todosModel.createTodo(
        "Test Todo",
        "Test Description",
        mockUserId
      );

      expect(prisma.todo.create).toHaveBeenCalledWith({
        data: {
          title: "Test Todo",
          description: "Test Description",
          userId: mockUserId,
        },
        include: { user: true },
      });
      expect(result).toEqual(mockTodo);
    });

    it("should handle null description", async () => {
      const mockTodo = {
        id: "660e8400-e29b-41d4-a716-446655440000",
        title: "Test Todo",
        description: null,
        completed: false,
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: mockUserId,
          email: "test@example.com",
        },
      };

      (prisma.todo.create as any).mockResolvedValue(mockTodo);

      const result = await todosModel.createTodo("Test Todo", null, mockUserId);

      expect(prisma.todo.create).toHaveBeenCalledWith({
        data: {
          title: "Test Todo",
          description: null,
          userId: mockUserId,
        },
        include: { user: true },
      });
      expect(result).toEqual(mockTodo);
    });

    it("should throw error when database error occurs", async () => {
      const dbError = new Error("Database connection failed");
      (prisma.todo.create as any).mockRejectedValue(dbError);

      await expect(
        todosModel.createTodo("Test Todo", null, mockUserId)
      ).rejects.toThrow("Database connection failed");
    });
  });

  describe("getTodoById", () => {
    const mockUserId = "550e8400-e29b-41d4-a716-446655440000";
    const mockTodoId = "660e8400-e29b-41d4-a716-446655440000";

    it("should call prisma.todo.findFirst with correct parameters and return todo", async () => {
      const mockTodo = {
        id: mockTodoId,
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
      };

      (prisma.todo.findFirst as any).mockResolvedValue(mockTodo);

      const result = await todosModel.getTodoById(mockTodoId, mockUserId);

      expect(prisma.todo.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockTodoId,
          userId: mockUserId,
        },
        include: { user: true },
      });
      expect(result).toEqual(mockTodo);
    });

    it("should return null when todo is not found", async () => {
      (prisma.todo.findFirst as any).mockResolvedValue(null);

      const result = await todosModel.getTodoById(mockTodoId, mockUserId);

      expect(prisma.todo.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockTodoId,
          userId: mockUserId,
        },
        include: { user: true },
      });
      expect(result).toBeNull();
    });

    it("should throw error when database error occurs", async () => {
      const dbError = new Error("Database connection failed");
      (prisma.todo.findFirst as any).mockRejectedValue(dbError);

      await expect(
        todosModel.getTodoById(mockTodoId, mockUserId)
      ).rejects.toThrow("Database connection failed");
    });
  });
});
