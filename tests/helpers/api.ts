const API_URL = process.env.API_URL || 'http://localhost:3011';

export async function authenticatedFetch(
  endpoint: string, 
  token: string, 
  options: RequestInit = {}
) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
}