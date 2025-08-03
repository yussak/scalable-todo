import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { TodosFuncController } from "../todosFuncController";
import { TodoModel } from "../../models/todoModel";
import prisma from "../../prisma";

vi.mock("../../models/todoModel", () => ({
  TodoModel: vi.fn().mockImplementation(() => ({
    getTodosByUserId: vi.fn(),
  })),
}));

vi.mock("../../prisma", () => ({
  default: {
    todo: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    comment: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("TodosFuncController", () => {
  const mockUserId = "550e8400-e29b-41d4-a716-446655440000";
  const mockUserId2 = "550e8400-e29b-41d4-a716-446655440001";
  const mockTodoId = "660e8400-e29b-41d4-a716-446655440000";
  const mockCommentId = 1;

  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: any;
  let statusMock: any;
  let mockTodoModel: any;

  beforeEach(() => {
    mockTodoModel = {
      getTodosByUserId: vi.fn(),
    };
    (TodoModel as any).mockImplementation(() => mockTodoModel);

    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnThis();

    mockRequest = {
      query: {},
      params: {},
      body: {},
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };

    vi.clearAllMocks();
  });

  describe("getTodos", () => {
    it("should return 400 when userId is not provided", async () => {
      mockRequest.query = {};

      await TodosFuncController.getTodos(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 400 when userId is empty string", async () => {
      mockRequest.query = { userId: "" };

      await TodosFuncController.getTodos(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 400 when userId is not a string", async () => {
      mockRequest.query = { userId: 123 };

      await TodosFuncController.getTodos(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 400 when userId is whitespace only", async () => {
      mockRequest.query = { userId: "   " };

      await TodosFuncController.getTodos(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return todos when valid userId is provided", async () => {
      const mockTodos = [
        {
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
        },
      ];

      (prisma.todo.findMany as any).mockResolvedValue(mockTodos);
      mockRequest.query = { userId: mockUserId };

      await TodosFuncController.getTodos(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.todo.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        include: { user: true },
        orderBy: { createdAt: "desc" },
      });
      expect(jsonMock).toHaveBeenCalledWith(mockTodos);
    });

    it("should return 500 when database error occurs", async () => {
      (prisma.todo.findMany as any).mockRejectedValue(
        new Error("Database error")
      );
      mockRequest.query = { userId: mockUserId };

      await TodosFuncController.getTodos(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("getTodoById", () => {
    it("should return 400 when userId is not provided", async () => {
      mockRequest.params = { id: mockTodoId };
      mockRequest.query = {};

      await TodosFuncController.getTodoById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 400 when userId is empty string", async () => {
      mockRequest.params = { id: mockTodoId };
      mockRequest.query = { userId: "" };

      await TodosFuncController.getTodoById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 400 when userId is not a string", async () => {
      mockRequest.params = { id: mockTodoId };
      mockRequest.query = { userId: 123 };

      await TodosFuncController.getTodoById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 400 when todo ID is invalid", async () => {
      mockRequest.params = { id: "invalid" };
      mockRequest.query = { userId: mockUserId };

      await TodosFuncController.getTodoById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 400 when userId is whitespace only", async () => {
      mockRequest.params = { id: mockTodoId };
      mockRequest.query = { userId: "   " };

      await TodosFuncController.getTodoById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 404 when todo is not found", async () => {
      (prisma.todo.findFirst as any).mockResolvedValue(null);
      mockRequest.params = { id: mockTodoId };
      mockRequest.query = { userId: mockUserId };

      await TodosFuncController.getTodoById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.todo.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockTodoId,
          userId: mockUserId,
        },
        include: { user: true },
      });
      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("should return todo when valid ID and userId are provided", async () => {
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
      mockRequest.params = { id: mockTodoId };
      mockRequest.query = { userId: mockUserId };

      await TodosFuncController.getTodoById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.todo.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockTodoId,
          userId: mockUserId,
        },
        include: { user: true },
      });
      expect(jsonMock).toHaveBeenCalledWith(mockTodo);
    });

    it("should return 500 when database error occurs", async () => {
      (prisma.todo.findFirst as any).mockRejectedValue(
        new Error("Database error")
      );
      mockRequest.params = { id: mockTodoId };
      mockRequest.query = { userId: mockUserId };

      await TodosFuncController.getTodoById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("createTodo", () => {
    it("should return 400 when title is not provided", async () => {
      mockRequest.body = { userId: mockUserId };

      await TodosFuncController.createTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 400 when title is empty string", async () => {
      mockRequest.body = { title: "", userId: mockUserId };

      await TodosFuncController.createTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 400 when title is only whitespace", async () => {
      mockRequest.body = { title: "   ", userId: mockUserId };

      await TodosFuncController.createTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 400 when userId is not provided", async () => {
      mockRequest.body = { title: "Test Todo" };

      await TodosFuncController.createTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 400 when userId is not a string", async () => {
      mockRequest.body = { title: "Test Todo", userId: 123 };

      await TodosFuncController.createTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 400 when userId is empty string", async () => {
      mockRequest.body = { title: "Test Todo", userId: "" };

      await TodosFuncController.createTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should create todo successfully with title and userId", async () => {
      const mockCreatedTodo = {
        id: mockTodoId,
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

      (prisma.todo.create as any).mockResolvedValue(mockCreatedTodo);
      mockRequest.body = { title: "Test Todo", userId: mockUserId };

      await TodosFuncController.createTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.todo.create).toHaveBeenCalledWith({
        data: {
          title: "Test Todo",
          description: null,
          userId: mockUserId,
        },
        include: { user: true },
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockCreatedTodo);
    });

    it("should create todo successfully with title, description and userId", async () => {
      const mockCreatedTodo = {
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

      (prisma.todo.create as any).mockResolvedValue(mockCreatedTodo);
      mockRequest.body = {
        title: "Test Todo",
        description: "Test Description",
        userId: mockUserId,
      };

      await TodosFuncController.createTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.todo.create).toHaveBeenCalledWith({
        data: {
          title: "Test Todo",
          description: "Test Description",
          userId: mockUserId,
        },
        include: { user: true },
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockCreatedTodo);
    });

    it("should return 500 when database error occurs", async () => {
      (prisma.todo.create as any).mockRejectedValue(
        new Error("Database error")
      );
      mockRequest.body = { title: "Test Todo", userId: mockUserId };

      await TodosFuncController.createTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("updateTodo", () => {
    it("should return 400 when todo ID is invalid", async () => {
      mockRequest.params = { id: "invalid" };
      mockRequest.body = { title: "Updated Todo", userId: mockUserId };

      await TodosFuncController.updateTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 400 when title is not provided", async () => {
      mockRequest.params = { id: mockTodoId };
      mockRequest.body = { userId: mockUserId };

      await TodosFuncController.updateTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 400 when title is empty string", async () => {
      mockRequest.params = { id: mockTodoId };
      mockRequest.body = { title: "", userId: mockUserId };

      await TodosFuncController.updateTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 400 when title is only whitespace", async () => {
      mockRequest.params = { id: mockTodoId };
      mockRequest.body = { title: "   ", userId: mockUserId };

      await TodosFuncController.updateTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 400 when userId is not provided", async () => {
      mockRequest.params = { id: mockTodoId };
      mockRequest.body = { title: "Updated Todo" };

      await TodosFuncController.updateTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 400 when userId is not a string", async () => {
      mockRequest.params = { id: mockTodoId };
      mockRequest.body = { title: "Updated Todo", userId: 123 };

      await TodosFuncController.updateTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should update todo successfully with all fields", async () => {
      const mockUpdatedTodo = {
        id: mockTodoId,
        title: "Updated Todo",
        description: "Updated Description",
        completed: true,
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: mockUserId,
          email: "test@example.com",
        },
      };

      (prisma.todo.update as any).mockResolvedValue(mockUpdatedTodo);
      mockRequest.params = { id: mockTodoId };
      mockRequest.body = {
        title: "Updated Todo",
        description: "Updated Description",
        completed: true,
        userId: mockUserId,
      };

      await TodosFuncController.updateTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.todo.update).toHaveBeenCalledWith({
        where: { id: mockTodoId, userId: mockUserId },
        data: {
          title: "Updated Todo",
          description: "Updated Description",
          completed: true,
        },
        include: { user: true },
      });
      expect(jsonMock).toHaveBeenCalledWith(mockUpdatedTodo);
    });

    it("should update todo successfully with only title", async () => {
      const mockUpdatedTodo = {
        id: mockTodoId,
        title: "Updated Todo",
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

      (prisma.todo.update as any).mockResolvedValue(mockUpdatedTodo);
      mockRequest.params = { id: mockTodoId };
      mockRequest.body = {
        title: "Updated Todo",
        userId: mockUserId,
      };

      await TodosFuncController.updateTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.todo.update).toHaveBeenCalledWith({
        where: { id: mockTodoId, userId: mockUserId },
        data: {
          title: "Updated Todo",
          description: undefined,
          completed: undefined,
        },
        include: { user: true },
      });
      expect(jsonMock).toHaveBeenCalledWith(mockUpdatedTodo);
    });

    it("should return 404 when todo not found", async () => {
      const prismaError = new Error("Todo not found");
      (prismaError as any).code = "P2025";
      (prisma.todo.update as any).mockRejectedValue(prismaError);

      mockRequest.params = { id: mockTodoId };
      mockRequest.body = { title: "Updated Todo", userId: mockUserId };

      await TodosFuncController.updateTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("should return 500 when database error occurs", async () => {
      (prisma.todo.update as any).mockRejectedValue(
        new Error("Database error")
      );
      mockRequest.params = { id: mockTodoId };
      mockRequest.body = { title: "Updated Todo", userId: mockUserId };

      await TodosFuncController.updateTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("deleteTodo", () => {
    it("should return 400 when todo ID is invalid", async () => {
      mockRequest.params = { id: "invalid" };
      mockRequest.body = { userId: mockUserId };

      await TodosFuncController.deleteTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 400 when userId is not provided", async () => {
      mockRequest.params = { id: mockTodoId };
      mockRequest.body = {};

      await TodosFuncController.deleteTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 400 when userId is not a string", async () => {
      mockRequest.params = { id: mockTodoId };
      mockRequest.body = { userId: 123 };

      await TodosFuncController.deleteTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should delete todo and return remaining todos", async () => {
      const remainingTodos = [
        {
          id: 2,
          title: "Remaining Todo",
          description: null,
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

      (prisma.todo.delete as any).mockResolvedValue({ id: 1 });
      (prisma.todo.findMany as any).mockResolvedValue(remainingTodos);

      mockRequest.params = { id: mockTodoId };
      mockRequest.body = { userId: mockUserId };

      await TodosFuncController.deleteTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.todo.delete).toHaveBeenCalledWith({
        where: { id: mockTodoId, userId: mockUserId },
      });
      expect(prisma.todo.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        include: { user: true },
        orderBy: { createdAt: "desc" },
      });
      expect(jsonMock).toHaveBeenCalledWith(remainingTodos);
    });

    it("should return 404 when todo not found", async () => {
      const prismaError = new Error("Todo not found");
      (prismaError as any).code = "P2025";
      (prisma.todo.delete as any).mockRejectedValue(prismaError);

      mockRequest.params = { id: mockTodoId };
      mockRequest.body = { userId: mockUserId };

      await TodosFuncController.deleteTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("should return 500 when database error occurs", async () => {
      (prisma.todo.delete as any).mockRejectedValue(
        new Error("Database error")
      );
      mockRequest.params = { id: mockTodoId };
      mockRequest.body = { userId: mockUserId };

      await TodosFuncController.deleteTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("createComment", () => {
    it("should return 400 when content is not provided", async () => {
      mockRequest.params = { id: mockTodoId };
      mockRequest.body = {};

      await TodosFuncController.createComment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 400 when content is empty string", async () => {
      mockRequest.params = { id: mockTodoId };
      mockRequest.body = { content: "" };

      await TodosFuncController.createComment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 400 when content is only whitespace", async () => {
      mockRequest.params = { id: mockTodoId };
      mockRequest.body = { content: "   " };

      await TodosFuncController.createComment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 400 when todo ID is invalid", async () => {
      mockRequest.params = { id: "invalid" };
      mockRequest.body = { content: "Test comment" };

      await TodosFuncController.createComment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 400 when todo not found", async () => {
      (prisma.todo.findUnique as any).mockResolvedValue(null);
      mockRequest.params = { id: mockTodoId };
      mockRequest.body = { content: "Test comment" };

      await TodosFuncController.createComment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.todo.findUnique).toHaveBeenCalledWith({
        where: { id: mockTodoId },
      });
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should create comment successfully", async () => {
      const mockTodo = {
        id: mockTodoId,
        userId: mockUserId2,
      };

      const mockCreatedComment = {
        id: mockTodoId,
        content: "Test comment",
        todoId: mockTodoId,
        userId: mockUserId2,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: mockUserId2,
          email: "test@example.com",
        },
      };

      (prisma.todo.findUnique as any).mockResolvedValue(mockTodo);
      (prisma.comment.create as any).mockResolvedValue(mockCreatedComment);

      mockRequest.params = { id: mockTodoId };
      mockRequest.body = { content: "Test comment" };

      await TodosFuncController.createComment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.todo.findUnique).toHaveBeenCalledWith({
        where: { id: mockTodoId },
      });
      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          content: "Test comment",
          todoId: mockTodoId,
          userId: mockUserId2,
        },
        include: { user: true },
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockCreatedComment);
    });

    it("should return 500 when database error occurs", async () => {
      const mockTodo = {
        id: mockTodoId,
        userId: mockUserId2,
      };

      (prisma.todo.findUnique as any).mockResolvedValue(mockTodo);
      (prisma.comment.create as any).mockRejectedValue(
        new Error("Database error")
      );

      mockRequest.params = { id: mockTodoId };
      mockRequest.body = { content: "Test comment" };

      await TodosFuncController.createComment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("getComments", () => {
    it("should return 400 when todo ID is invalid", async () => {
      mockRequest.params = { id: "invalid" };

      await TodosFuncController.getComments(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 404 when todo not found", async () => {
      (prisma.todo.findUnique as any).mockResolvedValue(null);
      mockRequest.params = { id: mockTodoId };

      await TodosFuncController.getComments(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.todo.findUnique).toHaveBeenCalledWith({
        where: { id: mockTodoId },
      });
      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("should return comments successfully", async () => {
      const mockTodo = {
        id: mockTodoId,
        userId: mockUserId2,
      };

      const mockComments = [
        {
          id: mockTodoId,
          content: "First comment",
          todoId: mockTodoId,
          userId: mockUserId2,
          createdAt: new Date("2023-01-02"),
          updatedAt: new Date("2023-01-02"),
          user: {
            id: mockUserId2,
            email: "test@example.com",
          },
        },
        {
          id: 2,
          content: "Second comment",
          todoId: mockTodoId,
          userId: mockUserId2,
          createdAt: new Date("2023-01-01"),
          updatedAt: new Date("2023-01-01"),
          user: {
            id: mockUserId2,
            email: "test@example.com",
          },
        },
      ];

      (prisma.todo.findUnique as any).mockResolvedValue(mockTodo);
      (prisma.comment.findMany as any).mockResolvedValue(mockComments);

      mockRequest.params = { id: mockTodoId };

      await TodosFuncController.getComments(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.todo.findUnique).toHaveBeenCalledWith({
        where: { id: mockTodoId },
      });
      expect(prisma.comment.findMany).toHaveBeenCalledWith({
        where: { todoId: mockTodoId },
        include: { user: true },
        orderBy: { createdAt: "desc" },
      });
      expect(jsonMock).toHaveBeenCalledWith(mockComments);
    });

    it("should return empty array when no comments exist", async () => {
      const mockTodo = {
        id: mockTodoId,
        userId: mockUserId2,
      };

      (prisma.todo.findUnique as any).mockResolvedValue(mockTodo);
      (prisma.comment.findMany as any).mockResolvedValue([]);

      mockRequest.params = { id: mockTodoId };

      await TodosFuncController.getComments(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.comment.findMany).toHaveBeenCalledWith({
        where: { todoId: mockTodoId },
        include: { user: true },
        orderBy: { createdAt: "desc" },
      });
      expect(jsonMock).toHaveBeenCalledWith([]);
    });

    it("should return 500 when database error occurs", async () => {
      const mockTodo = {
        id: mockTodoId,
        userId: mockUserId2,
      };

      (prisma.todo.findUnique as any).mockResolvedValue(mockTodo);
      (prisma.comment.findMany as any).mockRejectedValue(
        new Error("Database error")
      );

      mockRequest.params = { id: mockTodoId };

      await TodosFuncController.getComments(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("deleteComment", () => {
    let sendMock: any;

    beforeEach(() => {
      sendMock = vi.fn();
      mockResponse.send = sendMock;
    });

    it("should return 400 when todo ID is invalid", async () => {
      mockRequest.params = { id: "invalid", commentId: "1" };

      await TodosFuncController.deleteComment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 404 when todo not found", async () => {
      (prisma.todo.findUnique as any).mockResolvedValue(null);
      mockRequest.params = { id: mockTodoId, commentId: "1" };

      await TodosFuncController.deleteComment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.todo.findUnique).toHaveBeenCalledWith({
        where: { id: mockTodoId },
      });
      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("should return 400 when comment ID is invalid", async () => {
      const mockTodo = {
        id: mockTodoId,
        userId: mockUserId2,
      };

      (prisma.todo.findUnique as any).mockResolvedValue(mockTodo);
      mockRequest.params = { id: mockTodoId, commentId: "invalid" };

      await TodosFuncController.deleteComment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 404 when comment not found", async () => {
      const mockTodo = {
        id: mockTodoId,
        userId: mockUserId2,
      };

      (prisma.todo.findUnique as any).mockResolvedValue(mockTodo);
      (prisma.comment.findFirst as any).mockResolvedValue(null);

      mockRequest.params = { id: mockTodoId, commentId: "1" };

      await TodosFuncController.deleteComment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.comment.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockCommentId,
          todoId: mockTodoId,
        },
      });
      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("should delete comment successfully", async () => {
      const mockTodo = {
        id: mockTodoId,
        userId: mockUserId2,
      };

      const mockComment = {
        id: mockCommentId,
        content: "Test comment",
        todoId: mockTodoId,
        userId: mockUserId2,
      };

      (prisma.todo.findUnique as any).mockResolvedValue(mockTodo);
      (prisma.comment.findFirst as any).mockResolvedValue(mockComment);
      (prisma.comment.delete as any).mockResolvedValue(mockComment);

      mockRequest.params = { id: mockTodoId, commentId: "1" };

      await TodosFuncController.deleteComment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.todo.findUnique).toHaveBeenCalledWith({
        where: { id: mockTodoId },
      });
      expect(prisma.comment.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockCommentId,
          todoId: mockTodoId,
        },
      });
      expect(prisma.comment.delete).toHaveBeenCalledWith({
        where: { id: mockCommentId },
      });
      expect(statusMock).toHaveBeenCalledWith(204);
    });

    it("should return 500 when database error occurs", async () => {
      const mockTodo = {
        id: mockTodoId,
        userId: mockUserId2,
      };

      const mockComment = {
        id: mockCommentId,
        content: "Test comment",
        todoId: mockTodoId,
        userId: mockUserId2,
      };

      (prisma.todo.findUnique as any).mockResolvedValue(mockTodo);
      (prisma.comment.findFirst as any).mockResolvedValue(mockComment);
      (prisma.comment.delete as any).mockRejectedValue(
        new Error("Database error")
      );

      mockRequest.params = { id: mockTodoId, commentId: "1" };

      await TodosFuncController.deleteComment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });
});
