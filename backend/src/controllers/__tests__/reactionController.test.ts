import { describe, it, expect, vi } from "vitest";
import { ReactionController } from "../reactionController.js";
import { ReactionModel } from "../../models/Reaction.js";

// ReactionModelをモック
vi.mock("../../models/Reaction.js", () => ({
  ReactionModel: {
    create: vi.fn(),
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
});
