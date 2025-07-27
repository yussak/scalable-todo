import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { TodosController } from "../todosController";
import prisma from "../../prisma";

vi.mock("../../prisma", () => ({
  default: {
    todo: {
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
        error: "userId must be a string",
      });
    });

    it("should return 400 when userId is empty string", async () => {
      mockRequest.query = { userId: "" };

      await todosController.getTodos(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "userId is required" });
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
});
