const API_URL = process.env.API_URL || 'http://localhost:3011';

export interface AuthInfo {
  token: string;
  userId: number;
  user: {
    id: number;
    email: string;
  };
}

export async function createTestUser(email: string, password: string) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create test user: ${response.status}`);
  }

  return response.json();
}

export async function loginTestUser(email: string, password: string): Promise<AuthInfo> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Failed to login test user: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    token: data.token,
    userId: data.user.id,
    user: data.user,
  };
}

export async function cleanupTestUser(userId: number) {
  // 将来的に必要であれば実装
  // 現在は自動的にクリーンアップされるためスキップ
}