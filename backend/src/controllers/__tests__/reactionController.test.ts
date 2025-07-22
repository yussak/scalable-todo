import { describe, it, expect, vi } from "vitest";
import { ReactionController } from "../reactionController.js";
import { ReactionModel } from "../../models/Reaction.js";

// ReactionModelをモック
vi.mock("../../models/Reaction.js", () => ({
  ReactionModel: {
    create: vi.fn(),
    findByTodo: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("ReactionController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常なリクエストで201とリアクションデータを返す", async () => {
    const mockData = { id: 1, todoId: 1, userId: 1, emoji: "👍" };
    (ReactionModel.create as any).mockResolvedValue(mockData);

    const mockReq = {
      params: { id: "1" },
      body: { emoji: "👍" },
      user: { id: 1 },
    } as any;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;

    await ReactionController.addReaction(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockData);
  });

  it("ReactionModelが正しいパラメータで呼ばれる", async () => {
    const mockReactionData = {
      id: 1,
      todoId: 1,
      userId: 1,
      emoji: "👍",
      createdAt: new Date(),
    };

    (ReactionModel.create as any).mockResolvedValue(mockReactionData);

    const mockReq = {
      params: { id: "1" },
      body: { emoji: "👍" },
      user: { id: 1 },
    } as any;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;

    await ReactionController.addReaction(mockReq, mockRes);

    expect(ReactionModel.create).toHaveBeenCalledWith({
      todoId: 1,
      userId: 1,
      emoji: "👍",
    });
    expect(mockRes.json).toHaveBeenCalledWith(mockReactionData);
  });

  it("getReactionsメソッドがTodoのリアクション一覧を返す", async () => {
    const mockReactions = [
      { id: 1, todoId: 1, userId: 1, emoji: "👍", createdAt: new Date() },
      { id: 2, todoId: 1, userId: 2, emoji: "❤️", createdAt: new Date() },
    ];

    (ReactionModel.findByTodo as any).mockResolvedValue(mockReactions);

    const mockReq = {
      params: { id: "1" },
    } as any;

    const mockRes = {
      json: vi.fn(),
    } as any;

    await ReactionController.getReactions(mockReq, mockRes);

    expect(ReactionModel.findByTodo).toHaveBeenCalledWith(1);
    expect(mockRes.json).toHaveBeenCalledWith(mockReactions);
  });

  describe("removeReaction", () => {
    it("正常なリクエストで204ステータスを返す", async () => {
      const mockDeletedReaction = { id: 1, todoId: 1, userId: 1, emoji: "👍" };
      (ReactionModel.delete as any).mockResolvedValue(mockDeletedReaction);

      const mockReq = {
        params: { id: "1" },
        body: { emoji: "👍" },
        user: { id: 1 },
      } as any;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await ReactionController.removeReaction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Reaction removed successfully",
      });
    });

    it("ReactionModelのdeleteメソッドが正しいパラメータで呼ばれる", async () => {
      const mockDeletedReaction = { id: 1, todoId: 1, userId: 1, emoji: "👍" };
      (ReactionModel.delete as any).mockResolvedValue(mockDeletedReaction);

      const mockReq = {
        params: { id: "1" },
        body: { emoji: "👍" },
        user: { id: 1 },
      } as any;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await ReactionController.removeReaction(mockReq, mockRes);

      expect(ReactionModel.delete).toHaveBeenCalledWith({
        todoId: 1,
        userId: 1,
        emoji: "👍",
      });
    });
  });
});
