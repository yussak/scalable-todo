/**
 * Express.jsのRequestインターフェースを拡張
 *
 * 認証ミドルウェア（authenticateToken）でreq.userにユーザー情報を設定するため、
 * Express.Requestにuserプロパティを追加する。
 * これにより、any型を使わずに型安全にreq.userを参照できる。
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export {};
