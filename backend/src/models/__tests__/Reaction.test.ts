import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ReactionModel } from "../Reaction.js";
import prisma from "../../prisma.js";

describe("ReactionModel", () => {
  let testUser: any;
  let testTodo: any;

  beforeEach(async () => {
    // テストユーザーとTodoを作成
    testUser = await prisma.user.create({
      data: {
        email: "test@example.com",
        password: "hashedpassword",
      },
    });

    testTodo = await prisma.todo.create({
      data: {
        title: "Test Todo",
        userId: testUser.id,
      },
    });
  });

  afterEach(async () => {
    // テストデータのクリーンアップ
    await prisma.reaction.deleteMany();
    await prisma.todo.deleteMany();
    await prisma.user.deleteMany();
  });

  describe("create", () => {
    it("リアクションを追加できる", async () => {
      const reaction = await ReactionModel.create({
        todoId: testTodo.id,
        userId: testUser.id,
        emoji: "👍",
      });

      expect(reaction).toMatchObject({
        todoId: testTodo.id,
        userId: testUser.id,
        emoji: "👍",
      });
      expect(reaction.id).toBeDefined();
      expect(reaction.createdAt).toBeDefined();
    });

    it("同じユーザーが同じTodoに同じ絵文字を追加するとエラーになる", async () => {
      // 最初のリアクションを追加
      await ReactionModel.create({
        todoId: testTodo.id,
        userId: testUser.id,
        emoji: "👍",
      });

      // 同じリアクションを追加しようとする
      await expect(
        ReactionModel.create({
          todoId: testTodo.id,
          userId: testUser.id,
          emoji: "👍",
        })
      ).rejects.toThrow();
    });

    it("同じユーザーが同じTodoに異なる絵文字は追加できる", async () => {
      await ReactionModel.create({
        todoId: testTodo.id,
        userId: testUser.id,
        emoji: "👍",
      });

      const reaction2 = await ReactionModel.create({
        todoId: testTodo.id,
        userId: testUser.id,
        emoji: "❤️",
      });

      expect(reaction2.emoji).toBe("❤️");
    });
  });

  describe("delete", () => {
    it("リアクションを削除できる", async () => {
      const reaction = await ReactionModel.create({
        todoId: testTodo.id,
        userId: testUser.id,
        emoji: "👍",
      });

      await ReactionModel.delete({
        todoId: testTodo.id,
        userId: testUser.id,
        emoji: "👍",
      });

      const found = await prisma.reaction.findUnique({
        where: { id: reaction.id },
      });
      expect(found).toBeNull();
    });
  });

  describe("findByTodo", () => {
    it("Todo IDでリアクション一覧を取得できる", async () => {
      await ReactionModel.create({
        todoId: testTodo.id,
        userId: testUser.id,
        emoji: "👍",
      });

      await ReactionModel.create({
        todoId: testTodo.id,
        userId: testUser.id,
        emoji: "❤️",
      });

      const reactions = await ReactionModel.findByTodo(testTodo.id);

      expect(reactions).toHaveLength(2);
      expect(reactions.map((r) => r.emoji)).toContain("👍");
      expect(reactions.map((r) => r.emoji)).toContain("❤️");
    });
  });
});
