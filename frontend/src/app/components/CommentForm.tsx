import { useState } from "react";
import api from "@/lib/api";

interface CommentFormProps {
  todoId: string;
  onCommentAdd: () => void;
}

export function CommentForm({ todoId, onCommentAdd }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post(`/todos/${todoId}/comments`, {
        content: content.trim(),
      });

      if (response.ok) {
        setContent("");
        onCommentAdd();
      } else {
        console.error("コメントの投稿に失敗しました");
      }
    } catch (error) {
      console.error("コメントの投稿でエラーが発生しました:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="コメントを入力してください"
        className="w-full p-2 border border-gray-300 rounded"
        disabled={isSubmitting}
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || !content.trim()}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "投稿中..." : "投稿"}
      </button>
    </div>
  );
}
