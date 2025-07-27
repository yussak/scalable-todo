import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { TodosController } from "../todosController";
import prisma from "../../prisma";

vi.mock("../../prisma", () => ({
  default: {
    todo: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
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
      mockRequest.body = { userId: "1" };

      await todosController.createTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Title is required" });
    });

    it("should return 400 when title is empty string", async () => {
      mockRequest.body = { title: "", userId: "1" };

      await todosController.createTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Title is required" });
    });

    it("should return 400 when title is only whitespace", async () => {
      mockRequest.body = { title: "   ", userId: "1" };

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

    it("should return 400 when userId is not a string", async () => {
      mockRequest.body = { title: "Test Todo", userId: 123 };

      await todosController.createTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "userId is required" });
    });

    it("should return 400 when userId is empty string", async () => {
      mockRequest.body = { title: "Test Todo", userId: "" };

      await todosController.createTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "userId is required" });
    });

    it("should return 400 when userId is only whitespace", async () => {
      mockRequest.body = { title: "Test Todo", userId: "   " };

      await todosController.createTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "userId is required" });
    });

    it("should return 400 when userId is not a valid number", async () => {
      mockRequest.body = { title: "Test Todo", userId: "invalid" };

      await todosController.createTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid userId" });
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
      mockRequest.body = { title: "Test Todo", userId: "1" };

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
        userId: "1",
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
      mockRequest.body = { title: "Test Todo", userId: "1" };

      await todosController.createTodo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Failed to create todo" });
    });
  });
});
