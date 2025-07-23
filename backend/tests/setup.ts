import { beforeAll } from "vitest";
import { config } from "dotenv";

beforeAll(async () => {
  // テスト実行前の安全性チェック
  // rootのtestsでは一旦はDB接続のテストはしないのでbackendのみでチェックしている

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error(
      "DATABASE_URLが設定されていません（または個別環境変数が不足）"
    );
  }

  if (!dbUrl.includes("test_myapp")) {
    throw new Error("テスト用DB（test_myapp）への接続のみ許可されています");
  }

  console.log("✅ テスト環境の安全性チェック完了");
});
