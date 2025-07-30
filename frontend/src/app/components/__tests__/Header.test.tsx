import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import Header from "../Header";
import { useAuth } from "@/app/contexts/AuthContext";

// useAuthをモック化
vi.mock("@/app/contexts/AuthContext");

describe("Header - ログアウト機能", () => {
  const mockLogout = vi.fn();
  const mockUser = { id: 1, email: "test@example.com" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ユーザーがログインしていない場合、何も表示しない", () => {
    (useAuth as any).mockReturnValue({
      user: null,
      logout: mockLogout,
      isLoading: false,
    });

    const { container } = render(<Header />);
    expect(container.firstChild).toBeNull();
  });

  it("ログインユーザーのメールアドレスが表示される", () => {
    (useAuth as any).mockReturnValue({
      user: mockUser,
      logout: mockLogout,
      isLoading: false,
    });

    render(<Header />);
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("ログアウトボタンが表示される", () => {
    (useAuth as any).mockReturnValue({
      user: mockUser,
      logout: mockLogout,
      isLoading: false,
    });

    render(<Header />);
    expect(screen.getByText("ログアウト")).toBeInTheDocument();
  });

  it("ログアウトボタンをクリックするとlogout関数が呼ばれる", () => {
    (useAuth as any).mockReturnValue({
      user: mockUser,
      logout: mockLogout,
      isLoading: false,
    });

    render(<Header />);
    const logoutButton = screen.getByText("ログアウト");

    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
