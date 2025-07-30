import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import TodoDetail from "./page";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";

vi.mock("next/navigation");
vi.mock("@/app/contexts/AuthContext");

const mockPush = vi.fn();
const mockRouter = {
  push: mockPush,
};

const mockUserId = "550e8400-e29b-41d4-a716-446655440000";

const mockUseAuth = {
  user: { id: mockUserId, email: "test@example.com" },
  logout: vi.fn(),
};

describe("TodoDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (useAuth as any).mockReturnValue(mockUseAuth);
  });

  // todo: うまく行かないので治す
  it.skip("should redirect to home if user is not authenticated", async () => {
    (useAuth as any).mockReturnValue({ user: null, isLoading: false });

    await act(async () => {
      render(<TodoDetail params={Promise.resolve({ id: "1" })} />);
    });

    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("should display loading state initially", async () => {
    await act(async () => {
      render(<TodoDetail params={Promise.resolve({ id: "1" })} />);
    });

    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
  });

  it("should display todo details when loaded successfully", async () => {
    const mockTodo = {
      id: 1,
      title: "Test Todo",
      description: "Test Description",
      completed: false,
      userId: mockUserId,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockTodo,
    });

    await act(async () => {
      render(<TodoDetail params={Promise.resolve({ id: "1" })} />);
    });

    await waitFor(() => {
      expect(screen.getByText("Test Todo")).toBeInTheDocument();
      expect(screen.getByText("Test Description")).toBeInTheDocument();
      expect(screen.getByText("○ 未完了")).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.NEXT_PUBLIC_API_URL}/todos/1?userId=${mockUserId}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  });

  it("should display completed status when todo is completed", async () => {
    const mockTodo = {
      id: 1,
      title: "Completed Todo",
      description: "This is completed",
      completed: true,
      userId: mockUserId,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockTodo,
    });

    await act(async () => {
      render(<TodoDetail params={Promise.resolve({ id: "1" })} />);
    });

    await waitFor(() => {
      expect(screen.getByText("✓ 完了")).toBeInTheDocument();
    });
  });

  it("should display error message when todo not found", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await act(async () => {
      render(<TodoDetail params={Promise.resolve({ id: "999" })} />);
    });

    await waitFor(() => {
      expect(
        screen.getByText("Todoが見つかりませんでした。")
      ).toBeInTheDocument();
    });
  });

  it("should display error message when fetch fails", async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));

    await act(async () => {
      render(<TodoDetail params={Promise.resolve({ id: "1" })} />);
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          "通信エラーが発生しました。しばらくしてから再度お試しください。"
        )
      ).toBeInTheDocument();
    });
  });

  it("should navigate back to home when back button is clicked", async () => {
    const mockTodo = {
      id: 1,
      title: "Test Todo",
      description: "Test Description",
      completed: false,
      userId: mockUserId,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockTodo,
    });

    await act(async () => {
      render(<TodoDetail params={Promise.resolve({ id: "1" })} />);
    });

    await waitFor(() => {
      expect(screen.getByText("Test Todo")).toBeInTheDocument();
    });

    const backButton = screen.getByText("← 戻る");
    backButton.click();

    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it('should display "説明なし" when description is null', async () => {
    const mockTodo = {
      id: 1,
      title: "Test Todo",
      description: null,
      completed: false,
      userId: mockUserId,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockTodo,
    });

    await act(async () => {
      render(<TodoDetail params={Promise.resolve({ id: "1" })} />);
    });

    await waitFor(() => {
      expect(screen.getByText("説明なし")).toBeInTheDocument();
    });
  });
});
