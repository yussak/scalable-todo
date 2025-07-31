import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CommentForm } from "../CommentForm";

// api.tsをモック
vi.mock("@/lib/api", () => ({
  default: {
    post: vi.fn(),
  },
}));

describe("CommentForm", () => {
  const mockTodoId = "660e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("コメント投稿フォームが表示される", () => {
    render(<CommentForm todoId={mockTodoId} onCommentAdd={() => {}} />);

    const textArea = screen.getByPlaceholderText("コメントを入力してください");
    const submitButton = screen.getByRole("button", { name: "投稿" });

    expect(textArea).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
  });

  it("フォーム送信時にAPIが呼び出される", async () => {
    const mockApi = await import("@/lib/api");
    const mockPost = vi.mocked(mockApi.default.post);
    mockPost.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        content: "テストコメント",
        todoId: mockTodoId,
      }),
    } as Response);

    const onCommentAdd = vi.fn();
    render(<CommentForm todoId={mockTodoId} onCommentAdd={onCommentAdd} />);

    const textArea = screen.getByPlaceholderText("コメントを入力してください");
    const submitButton = screen.getByRole("button", { name: "投稿" });

    // コメントを入力
    fireEvent.change(textArea, { target: { value: "テストコメント" } });

    // フォーム送信
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(`/todos/${mockTodoId}/comments`, {
        content: "テストコメント",
      });
      expect(onCommentAdd).toHaveBeenCalled();
    });
  });
});
