import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { TodosController } from "../todosController";
import prisma from "../../prisma";

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
    },
  },
}));

describe("TodosController", () => {
  let todosController: TodosController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(() => {
    todosController = new TodosController();
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

      await todosController.getTodos(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "userId is required",
      });
    });

    it("should return 400 when userId is empty string", async () => {
      mockRequest.query = { userId: "" };

      await todosController.getTodos(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "userId must not be empty",
      });
    });

    it("should return 400 when userId is not a string", async () => {
      mockRequest.query = { userId: 123 };

      await todosController.getTodos(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "userId must be a string",
      });
    });

    it("should return 400 when userId is not a valid number", async () => {
      mockRequest.query = { userId: "invalid" };

      await todosController.getTodos(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid userId" });
    });

    it("should return todos when valid userId is provided", async () => {
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
      mockRequest.query = { userId: "1" };

      await todosController.getTodos(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.todo.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: { user: true },
        orderBy: { createdAt: "desc" },
      });
      expect(jsonMock).toHaveBeenCalledWith(mockTodos);
    });

    it("should return 500 when database error occurs", async () => {
      (prisma.todo.findMany as any).mockRejectedValue(
        new Error("Database error")
      );
      mockRequest.query = { userId: "1" };

      await todosController.getTodos(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Failed to fetch todos" });
    });
  });

  describe("getTodoById", () => {
    it("should return 400 when userId is not provided", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = {};

      await todosController.getTodoById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "userId is required" });
    });

    it("should return 400 when userId is empty string", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = { userId: "" };

      await todosController.getTodoById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "userId is required" });
    });

    it("should return 400 when userId is not a string", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = { userId: 123 };

      await todosController.getTodoById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "userId is required" });
    });

    it("should return 400 when todo ID is invalid", async () => {
      mockRequest.params = { id: "invalid" };
      mockRequest.query = { userId: "1" };

      await todosController.getTodoById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid todo ID" });
    });

    it("should return 400 when userId is invalid", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = { userId: "invalid" };

      await todosController.getTodoById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid userId" });
    });

    it("should return 404 when todo is not found", async () => {
      (prisma.todo.findFirst as any).mockResolvedValue(null);
      mockRequest.params = { id: "1" };
      mockRequest.query = { userId: "1" };

      await todosController.getTodoById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.todo.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          userId: 1,
        },
        include: { user: true },
      });
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Todo not found" });
    });

    it("should return todo when valid ID and userId are provided", async () => {
      const mockTodo = {
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
      };

      (prisma.todo.findFirst as any).mockResolvedValue(mockTodo);
      mockRequest.params = { id: "1" };
      mockRequest.query = { userId: "1" };

      await todosController.getTodoById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.todo.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          userId: 1,
        },
        include: { user: true },
      });
      expect(jsonMock).toHaveBeenCalledWith(mockTodo);
    });

    it("should return 500 when database error occurs", async () => {
      (prisma.todo.findFirst as any).mockRejectedValue(
        new Error("Database error")
      );
      mockRequest.params = { id: "1" };
      mockRequest.query = { userId: "1" };

      await todosController.getTodoById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Failed to fetch todo" });
    });
  });

  describe("createTodo", () => {
    it("should return 400 when title is not provided", async () => {
      mockRequest.body = { userId: 1 };

      await todosController.createTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Title is required" });
    });

    it("should return 400 when title is empty string", async () => {
      mockRequest.body = { title: "", userId: 1 };

      await todosController.createTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Title is required" });
    });

    it("should return 400 when title is only whitespace", async () => {
      mockRequest.body = { title: "   ", userId: 1 };

      await todosController.createTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Title is required" });
    });

    it("should return 400 when userId is not provided", async () => {
      mockRequest.body = { title: "Test Todo" };

      await todosController.createTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "userId is required" });
    });

    it("should return 400 when userId is not a number", async () => {
      mockRequest.body = { title: "Test Todo", userId: "123" };

      await todosController.createTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "userId is required" });
    });

    it("should return 400 when userId is null", async () => {
      mockRequest.body = { title: "Test Todo", userId: null };

      await todosController.createTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "userId is required" });
    });

    it("should return 400 when userId is a string", async () => {
      mockRequest.body = { title: "Test Todo", userId: "invalid" };

      await todosController.createTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "userId is required" });
    });

    it("should create todo successfully with title and userId", async () => {
      const mockCreatedTodo = {
        id: 1,
        title: "Test Todo",
        description: null,
        completed: false,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 1,
          email: "test@example.com",
        },
      };

      (prisma.todo.create as any).mockResolvedValue(mockCreatedTodo);
      mockRequest.body = { title: "Test Todo", userId: 1 };

      await todosController.createTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.todo.create).toHaveBeenCalledWith({
        data: {
          title: "Test Todo",
          description: null,
          userId: 1,
        },
        include: { user: true },
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockCreatedTodo);
    });

    it("should create todo successfully with title, description and userId", async () => {
      const mockCreatedTodo = {
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
      };

      (prisma.todo.create as any).mockResolvedValue(mockCreatedTodo);
      mockRequest.body = {
        title: "Test Todo",
        description: "Test Description",
        userId: 1,
      };

      await todosController.createTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.todo.create).toHaveBeenCalledWith({
        data: {
          title: "Test Todo",
          description: "Test Description",
          userId: 1,
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
      mockRequest.body = { title: "Test Todo", userId: 1 };

      await todosController.createTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Failed to create todo" });
    });
  });

  describe("updateTodo", () => {
    it("should return 400 when todo ID is invalid", async () => {
      mockRequest.params = { id: "invalid" };
      mockRequest.body = { title: "Updated Todo", userId: 1 };

      await todosController.updateTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid todo ID" });
    });

    it("should return 400 when title is not provided", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { userId: 1 };

      await todosController.updateTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Title is required" });
    });

    it("should return 400 when title is empty string", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { title: "", userId: 1 };

      await todosController.updateTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Title is required" });
    });

    it("should return 400 when title is only whitespace", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { title: "   ", userId: 1 };

      await todosController.updateTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Title is required" });
    });

    it("should return 400 when userId is not provided", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { title: "Updated Todo" };

      await todosController.updateTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "userId is required" });
    });

    it("should return 400 when userId is not a number", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { title: "Updated Todo", userId: "123" };

      await todosController.updateTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "userId is required" });
    });

    it("should update todo successfully with all fields", async () => {
      const mockUpdatedTodo = {
        id: 1,
        title: "Updated Todo",
        description: "Updated Description",
        completed: true,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 1,
          email: "test@example.com",
        },
      };

      (prisma.todo.update as any).mockResolvedValue(mockUpdatedTodo);
      mockRequest.params = { id: "1" };
      mockRequest.body = {
        title: "Updated Todo",
        description: "Updated Description",
        completed: true,
        userId: 1,
      };

      await todosController.updateTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.todo.update).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
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
        id: 1,
        title: "Updated Todo",
        description: null,
        completed: false,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 1,
          email: "test@example.com",
        },
      };

      (prisma.todo.update as any).mockResolvedValue(mockUpdatedTodo);
      mockRequest.params = { id: "1" };
      mockRequest.body = {
        title: "Updated Todo",
        userId: 1,
      };

      await todosController.updateTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.todo.update).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
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

      mockRequest.params = { id: "1" };
      mockRequest.body = { title: "Updated Todo", userId: 1 };

      await todosController.updateTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Todo not found" });
    });

    it("should return 500 when database error occurs", async () => {
      (prisma.todo.update as any).mockRejectedValue(
        new Error("Database error")
      );
      mockRequest.params = { id: "1" };
      mockRequest.body = { title: "Updated Todo", userId: 1 };

      await todosController.updateTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Failed to update todo" });
    });
  });

  describe("deleteTodo", () => {
    it("should return 400 when todo ID is invalid", async () => {
      mockRequest.params = { id: "invalid" };
      mockRequest.body = { userId: 1 };

      await todosController.deleteTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid todo ID" });
    });

    it("should return 400 when userId is not provided", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {};

      await todosController.deleteTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "userId is required" });
    });

    it("should return 400 when userId is not a number", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { userId: "123" };

      await todosController.deleteTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "userId is required" });
    });

    it("should delete todo and return remaining todos", async () => {
      const remainingTodos = [
        {
          id: 2,
          title: "Remaining Todo",
          description: null,
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

      (prisma.todo.delete as any).mockResolvedValue({ id: 1 });
      (prisma.todo.findMany as any).mockResolvedValue(remainingTodos);

      mockRequest.params = { id: "1" };
      mockRequest.body = { userId: 1 };

      await todosController.deleteTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.todo.delete).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
      });
      expect(prisma.todo.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: { user: true },
        orderBy: { createdAt: "desc" },
      });
      expect(jsonMock).toHaveBeenCalledWith(remainingTodos);
    });

    it("should return 404 when todo not found", async () => {
      const prismaError = new Error("Todo not found");
      (prismaError as any).code = "P2025";
      (prisma.todo.delete as any).mockRejectedValue(prismaError);

      mockRequest.params = { id: "1" };
      mockRequest.body = { userId: 1 };

      await todosController.deleteTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Todo not found" });
    });

    it("should return 500 when database error occurs", async () => {
      (prisma.todo.delete as any).mockRejectedValue(
        new Error("Database error")
      );
      mockRequest.params = { id: "1" };
      mockRequest.body = { userId: 1 };

      await todosController.deleteTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Failed to delete todo" });
    });
  });

  describe("createComment", () => {
    it("should return 400 when content is not provided", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {};

      await todosController.createComment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Content is required" });
    });

    it("should return 400 when content is empty string", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { content: "" };

      await todosController.createComment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Content is required" });
    });

    it("should return 400 when content is only whitespace", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { content: "   " };

      await todosController.createComment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Content is required" });
    });

    it("should return 400 when todo ID is invalid", async () => {
      mockRequest.params = { id: "invalid" };
      mockRequest.body = { content: "Test comment" };

      await todosController.createComment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Invalid todo ID or todo not found",
      });
    });

    it("should return 400 when todo not found", async () => {
      (prisma.todo.findUnique as any).mockResolvedValue(null);
      mockRequest.params = { id: "1" };
      mockRequest.body = { content: "Test comment" };

      await todosController.createComment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.todo.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Invalid todo ID or todo not found",
      });
    });

    it("should create comment successfully", async () => {
      const mockTodo = {
        id: 1,
        userId: 2,
      };

      const mockCreatedComment = {
        id: 1,
        content: "Test comment",
        todoId: 1,
        userId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 2,
          email: "test@example.com",
        },
      };

      (prisma.todo.findUnique as any).mockResolvedValue(mockTodo);
      (prisma.comment.create as any).mockResolvedValue(mockCreatedComment);

      mockRequest.params = { id: "1" };
      mockRequest.body = { content: "Test comment" };

      await todosController.createComment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.todo.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          content: "Test comment",
          todoId: 1,
          userId: 2,
        },
        include: { user: true },
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockCreatedComment);
    });

    it("should return 500 when database error occurs", async () => {
      const mockTodo = {
        id: 1,
        userId: 2,
      };

      (prisma.todo.findUnique as any).mockResolvedValue(mockTodo);
      (prisma.comment.create as any).mockRejectedValue(
        new Error("Database error")
      );

      mockRequest.params = { id: "1" };
      mockRequest.body = { content: "Test comment" };

      await todosController.createComment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Failed to create comment",
      });
    });
  });

  describe("getComments", () => {
    it("should return 400 when todo ID is invalid", async () => {
      mockRequest.params = { id: "invalid" };

      await todosController.getComments(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Invalid todo ID or todo not found",
      });
    });

    it("should return 400 when todo not found", async () => {
      (prisma.todo.findUnique as any).mockResolvedValue(null);
      mockRequest.params = { id: "1" };

      await todosController.getComments(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.todo.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Invalid todo ID or todo not found",
      });
    });

    it("should return comments successfully", async () => {
      const mockTodo = {
        id: 1,
        userId: 2,
      };

      const mockComments = [
        {
          id: 1,
          content: "First comment",
          todoId: 1,
          userId: 2,
          createdAt: new Date("2023-01-02"),
          updatedAt: new Date("2023-01-02"),
          user: {
            id: 2,
            email: "test@example.com",
          },
        },
        {
          id: 2,
          content: "Second comment",
          todoId: 1,
          userId: 2,
          createdAt: new Date("2023-01-01"),
          updatedAt: new Date("2023-01-01"),
          user: {
            id: 2,
            email: "test@example.com",
          },
        },
      ];

      (prisma.todo.findUnique as any).mockResolvedValue(mockTodo);
      (prisma.comment.findMany as any).mockResolvedValue(mockComments);

      mockRequest.params = { id: "1" };

      await todosController.getComments(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.todo.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prisma.comment.findMany).toHaveBeenCalledWith({
        where: { todoId: 1 },
        include: { user: true },
        orderBy: { createdAt: "desc" },
      });
      expect(jsonMock).toHaveBeenCalledWith(mockComments);
    });

    it("should return empty array when no comments exist", async () => {
      const mockTodo = {
        id: 1,
        userId: 2,
      };

      (prisma.todo.findUnique as any).mockResolvedValue(mockTodo);
      (prisma.comment.findMany as any).mockResolvedValue([]);

      mockRequest.params = { id: "1" };

      await todosController.getComments(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.comment.findMany).toHaveBeenCalledWith({
        where: { todoId: 1 },
        include: { user: true },
        orderBy: { createdAt: "desc" },
      });
      expect(jsonMock).toHaveBeenCalledWith([]);
    });

    it("should return 500 when database error occurs", async () => {
      const mockTodo = {
        id: 1,
        userId: 2,
      };

      (prisma.todo.findUnique as any).mockResolvedValue(mockTodo);
      (prisma.comment.findMany as any).mockRejectedValue(
        new Error("Database error")
      );

      mockRequest.params = { id: "1" };

      await todosController.getComments(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Failed to fetch comments",
      });
    });
  });
});
