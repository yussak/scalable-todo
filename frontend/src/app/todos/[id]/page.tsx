"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { CommentForm } from "@/app/components/CommentForm";

interface Todo {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export default function TodoDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [todo, setTodo] = useState<Todo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    // todo: 認証チェックがないので一時的　作ったら消す
    if (!user) {
      router.push("/");
      return;
    }

    const fetchTodo = async () => {
      try {
        const resolvedParams = await params;
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/todos/${resolvedParams.id}?userId=${user.id}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError("Todoが見つかりませんでした。");
          } else {
            setError("エラーが発生しました。");
          }
          return;
        }

        const todoData = await response.json();
        setTodo(todoData);
      } catch (err) {
        setError("エラーが発生しました。");
      } finally {
        setLoading(false);
      }
    };

    fetchTodo();
  }, [user, authLoading, params, router]);

  if (loading) {
    return <div className="p-4">読み込み中...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!todo) {
    return <div className="p-4">Todoが見つかりませんでした。</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push("/")}
            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
          >
            ← 戻る
          </button>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {todo.title}
          </h1>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">説明</h2>
            <p className="text-gray-700 text-base leading-relaxed bg-gray-50 p-4 rounded-lg">
              {todo.description || "説明なし"}
            </p>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              ステータス
            </h2>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                todo.completed
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : "bg-yellow-100 text-yellow-800 border border-yellow-200"
              }`}
            >
              {todo.completed ? "✓ 完了" : "○ 未完了"}
            </span>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              詳細情報
            </h2>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600">
                <span className="font-medium">作成日:</span>{" "}
                {new Date(todo.createdAt).toLocaleString("ja-JP")}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">更新日:</span>{" "}
                {new Date(todo.updatedAt).toLocaleString("ja-JP")}
              </p>
            </div>
          </div>

          {/* コメントセクション */}
          <div className="mt-6 bg-white shadow-lg rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">コメント</h2>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                新しいコメントを投稿
              </h3>
              <CommentForm todoId={todo.id} onCommentAdd={() => {}} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
