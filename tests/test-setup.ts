import '@testing-library/jest-dom'

// グローバル設定
globalThis.API_URL = process.env.API_URL || 'http://localhost:3011'
globalThis.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3010'

// テスト用のタイムアウト設定
beforeAll(() => {
  // 必要に応じてグローバルなセットアップを追加
})

afterAll(() => {
  // 必要に応じてグローバルなクリーンアップを追加
})