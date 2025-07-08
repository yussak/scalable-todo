import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import Home from './page'

// useRouterをモック化
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// localStorageをモック化
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

// fetchをモック化
global.fetch = vi.fn()

describe('Home Page - ログアウト機能', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 初期状態：ユーザーがログイン済み
    ;(localStorage.getItem as unknown as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify({ id: 1, email: 'test@example.com' }))
    ;(global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })
  })

  it('ログアウトボタンが表示される', () => {
    act(() => {
      render(<Home />)
    })
    
    expect(screen.getByTestId('logout-button')).toBeInTheDocument()
  })

  it('ログアウトボタンがクリックされたときにlocalStorageから認証情報が削除される', async () => {
    act(() => {
      render(<Home />)
    })
    
    const logoutButton = screen.getByTestId('logout-button')
    
    await act(async () => {
      fireEvent.click(logoutButton)
    })

    await waitFor(() => {
      expect(localStorage.removeItem).toHaveBeenCalledWith('token')
      expect(localStorage.removeItem).toHaveBeenCalledWith('user')
    })
  })

  it('ログアウト後にログインページにリダイレクトされる', async () => {
    act(() => {
      render(<Home />)
    })
    
    const logoutButton = screen.getByTestId('logout-button')
    
    await act(async () => {
      fireEvent.click(logoutButton)
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('ログアウト時に現在のユーザーIDがリセットされる', async () => {
    act(() => {
      render(<Home />)
    })
    
    // 最初はユーザーIDが表示されている
    expect(screen.getByText('ユーザーID: 1 でログイン中')).toBeInTheDocument()
    
    const logoutButton = screen.getByTestId('logout-button')
    
    await act(async () => {
      fireEvent.click(logoutButton)
    })

    await waitFor(() => {
      expect(screen.queryByText('ユーザーID: 1 でログイン中')).not.toBeInTheDocument()
    })
  })
})