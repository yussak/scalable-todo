import { execSync } from "child_process";

export async function setup() {
  // テスト実行前の安全性チェック
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

  // マイグレーション自動実行
  try {
    console.log("🔄 テスト用DBマイグレーション実行中...");
    execSync("npx prisma db push --skip-generate --accept-data-loss", {
      stdio: "inherit", // schemaをDBに同期（テスト用）
      env: { ...process.env, DATABASE_URL: dbUrl },
    });
    console.log("✅ マイグレーション完了");
  } catch (error) {
    console.error("❌ マイグレーション失敗:", error);
    throw error;
  }
}
