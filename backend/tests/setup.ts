import { beforeAll } from "vitest";
import { config } from "dotenv";

beforeAll(async () => {
  // テスト実行前の安全性チェック
  // rootのtestsでは一旦はDB接続のテストはしないのでbackendのみでチェックしている

  config({ path: ".env.test", override: true });

  if (
    // todo: DATABASE_URLは廃止(動的に作れるため)
    process.env.DATABASE_URL == null &&
    process.env.DB_USERNAME != null &&
    process.env.DB_PASSWORD != null &&
    process.env.DB_HOSTNAME != null &&
    process.env.DB_DBNAME != null
  ) {
    process.env.DATABASE_URL = `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOSTNAME}:5432/${process.env.DB_DBNAME}`;
  }

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
