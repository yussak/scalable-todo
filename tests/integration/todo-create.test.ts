import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestUser, loginTestUser, type AuthInfo } from "../helpers/auth";
import { authenticatedFetch } from "../helpers/api";

/**
 * TODO作成機能の統合テスト
 * フロントエンド・バックエンド間の連携を検証
 *
 * テスト戦略:
 * - 実際のバックエンドAPIを使用
 * - 認証を含む完全なフローをテスト
 * - 正常系のみをテスト
 */

describe("TODO作成 統合テスト", () => {
  let authInfo: AuthInfo;
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "password123";

  beforeAll(async () => {
    await createTestUser(testEmail, testPassword);
    authInfo = await loginTestUser(testEmail, testPassword);
  });

  afterAll(async () => {
    // バックエンドのテストでクリーンアップが自動実行されるため、
    // 明示的なクリーンアップは不要
  });

  describe("正常系", () => {
    it("認証済みユーザーが新しいTODOを作成できる", async () => {
      const todoData = {
        title: "統合テスト用TODO",
        description: "このTODOは統合テストで作成されました",
        userId: authInfo.userId,
      };

      const response = await authenticatedFetch("/api/todos", authInfo.token, {
        method: "POST",
        body: JSON.stringify(todoData),
      });

      expect(response.status).toBe(201);

      const createdTodo = await response.json();

      expect(createdTodo).toMatchObject({
        id: expect.any(Number),
        title: todoData.title,
        description: todoData.description,
        completed: false,
        userId: authInfo.userId,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        user: expect.objectContaining({
          id: authInfo.userId,
          email: testEmail,
        }),
      });
    });
  });
});
