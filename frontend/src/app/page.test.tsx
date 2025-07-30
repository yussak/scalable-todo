import { describe, it, vi } from "vitest";

// useRouterをモック化
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// localStorageをモック化
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// fetchをモック化
global.fetch = vi.fn();

// TODO: Home コンポーネントのTODO機能のテストを追加予定
describe.skip("Home Page - TODO機能", () => {
  // TODO: Homeコンポーネントの実際の機能をテストする
  it.todo("TODO作成機能のテスト");
  it.todo("TODO一覧表示のテスト");
  it.todo("TODO編集機能のテスト");
  it.todo("TODO削除機能のテスト");
});
