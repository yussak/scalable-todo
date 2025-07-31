import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Comment } from "@/types/comment";

interface CommentListProps {
  todoId: string;
  refresh: number; // リフレッシュトリガー
}

export function CommentList({ todoId, refresh }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

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
      console.error("Failed to fetch comments:", err);
      setError("コメントの取得でエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      setDeletingIds((prev) => new Set(prev).add(commentId));

      const response = await api.delete(
        `/todos/${todoId}/comments/${commentId}`
      );

      if (response.ok) {
        // コメントリストから削除
        setComments((prevComments) =>
          prevComments.filter((comment) => comment.id !== commentId)
        );
      } else {
        setError("コメントの削除に失敗しました");
      }
    } catch (err) {
      console.error("Failed to delete comment:", err);
      setError("コメントの削除でエラーが発生しました");
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
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
            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-500">
                {new Date(comment.createdAt).toLocaleString("ja-JP")}
              </div>
              <button
                onClick={() => handleDeleteComment(comment.id)}
                disabled={deletingIds.has(comment.id)}
                className="text-red-500 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed text-sm"
                title="コメントを削除"
              >
                {deletingIds.has(comment.id) ? "削除中..." : "削除"}
              </button>
            </div>
          </div>
          <div className="text-gray-700 leading-relaxed">{comment.content}</div>
        </div>
      ))}
    </div>
  );
}
