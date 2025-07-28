"use client";

import Link from "next/link";
import { Todo } from "@/types/todo";

interface TodoItemProps {
  todo: Todo;
  onEdit: (todo: Todo) => void;
  onDelete: (id: number) => void;
}

export default function TodoItem({ todo, onEdit, onDelete }: TodoItemProps) {
  return (
    <>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{todo.title}</h3>
      {todo.description && (
        <p className="text-gray-600 mb-4">{todo.description}</p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              todo.completed
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {todo.completed ? "完了" : "未完了"}
          </span>
          <span>{new Date(todo.createdAt).toLocaleDateString("ja-JP")}</span>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/todos/${todo.id}`}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
          >
            詳細
          </Link>
          <button
            onClick={() => onEdit(todo)}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
          >
            編集
          </button>
          <button
            onClick={() => onDelete(todo.id)}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
          >
            削除
          </button>
        </div>
      </div>
    </>
  );
}
