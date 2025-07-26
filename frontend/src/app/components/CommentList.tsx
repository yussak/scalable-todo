import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Comment {
  id: number;
  content: string;
  todoId: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    email: string;
  };
}

interface CommentListProps {
  todoId: number;
  refresh: number; // リフレッシュトリガー
}

export function CommentList({ todoId, refresh }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/todos/${todoId}/comments`);

      if (response.ok) {
        const data = await response.json();
        setComments(data);
        setError(null);
      } else {
        setError("コメントの取得に失敗しました");
      }
    } catch (err) {
      setError("コメントの取得でエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [todoId, refresh]);

  if (loading) {
    return <div className="text-gray-500">コメントを読み込み中...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (comments.length === 0) {
    return <div className="text-gray-500">まだコメントがありません</div>;
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="font-medium text-gray-900">
              {comment.user.email}
            </div>
            <div className="text-sm text-gray-500">
              {new Date(comment.createdAt).toLocaleString("ja-JP")}
            </div>
          </div>
          <div className="text-gray-700 leading-relaxed">{comment.content}</div>
        </div>
      ))}
    </div>
  );
}
