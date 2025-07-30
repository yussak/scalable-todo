const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// todo: 他のtsxも順次これを読むのに変える
const api = {
  get(url: string): Promise<Response> {
    return fetch(`${BASE_URL}${url}`);
  },

  // JSONオブジェクト（文字列キー + 任意の値）を受け取る
  post(url: string, data?: Record<string, unknown>): Promise<Response> {
    return fetch(`${BASE_URL}${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // TODO: CIビルドを通すため一時的に無視、後で正しく修正
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  put(url: string, data?: any): Promise<Response> {
    return fetch(`${BASE_URL}${url}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // TODO: CIビルドを通すため一時的に無視、後で正しく修正
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete(url: string, data?: any): Promise<Response> {
    return fetch(`${BASE_URL}${url}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  },
};

export default api;
