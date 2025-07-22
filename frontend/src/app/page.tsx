"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "./contexts/AuthContext";
import TodoForm from "./components/TodoForm";
import { ReactionPicker } from "./components/ReactionPicker";
import api from "@/lib/api";

interface Reaction {
  id: number;
  todoId: number;
  userId: number;
  emoji: string;
  createdAt: string;
}

interface Todo {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    email: string;
  };
  reactions?: Reaction[];
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCompleted, setEditCompleted] = useState(false);
  const { user } = useAuth();

  const fetchTodos = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await api.get(`/todos?userId=${user.id}`);
      if (response.ok) {
        const todos = await response.json();

        // 各Todoのリアクションを取得
        const todosWithReactions = await Promise.all(
          todos.map(async (todo: Todo) => {
            try {
              const reactionsResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/todos/${todo.id}/reactions`
              );
              if (reactionsResponse.ok) {
                const reactions = await reactionsResponse.json();
                return { ...todo, reactions };
              }
            } catch (error) {
              console.error(
                `Failed to fetch reactions for todo ${todo.id}:`,
                error
              );
            }
            return todo;
          })
        );

        setTodos(todosWithReactions);
      }
    } catch (error) {
      console.error("Failed to fetch todos:", error);
    }
  }, [user?.id]);

  const createTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user?.id) return;

    setLoading(true);
    try {
      const response = await api.post("/todos", {
        title: title.trim(),
        description: description.trim() || null,
        userId: user.id,
      });

      if (response.ok) {
        setTitle("");
        setDescription("");
        fetchTodos();
      }
    } catch (error) {
      console.error("Failed to create todo:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTodo = async (id: number) => {
    if (!user?.id) return;

    try {
      const response = await api.delete(`/todos/${id}`, {
        userId: user.id,
      });

      if (response.ok) {
        const updatedTodos = await response.json();
        setTodos(updatedTodos);
      }
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDescription(todo.description || "");
    setEditCompleted(todo.completed);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setEditCompleted(false);
  };

  const updateTodo = async (id: number) => {
    if (!editTitle.trim() || !user?.id) return;

    try {
      const response = await api.put(`/todos/${id}`, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        completed: editCompleted,
        userId: user.id,
      });

      if (response.ok) {
        const updatedTodo = await response.json();
        setTodos(todos.map((todo) => (todo.id === id ? updatedTodo : todo)));
        cancelEdit();
      }
    } catch (error) {
      console.error("Failed to update todo:", error);
    }
  };

  const addReaction = async (todoId: number, emoji: string) => {
    if (!user?.id) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/todos/${todoId}/reactions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ emoji }),
        }
      );

      if (response.ok) {
        // リアクション一覧を更新
        console.log("Reaction added successfully:", emoji);
        fetchTodos();
      } else {
        console.error(
          "Failed to add reaction:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Failed to add reaction:", error);
    }
  };

  const removeReaction = async (todoId: number, emoji: string) => {
    if (!user?.id) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/todos/${todoId}/reactions`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ emoji }),
        }
      );

      if (response.ok) {
        // リアクション一覧を更新
        console.log("Reaction removed successfully:", emoji);
        fetchTodos();
      } else {
        console.error(
          "Failed to remove reaction:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Failed to remove reaction:", error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchTodos();
    }
  }, [user?.id, fetchTodos]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editingId !== null) {
        cancelEdit();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [editingId]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <TodoForm
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          loading={loading}
          onSubmit={createTodo}
        />

        <div className="space-y-4">
          {todos.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              TODOがありません
            </div>
          ) : (
            todos.map((todo) => (
              <div key={todo.id} className="bg-white rounded-lg shadow-md p-6">
                {editingId === todo.id ? (
                  // 編集モード
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      placeholder="タイトル"
                      autoFocus
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      placeholder="説明"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`completed-${todo.id}`}
                        checked={editCompleted}
                        onChange={(e) => setEditCompleted(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor={`completed-${todo.id}`}
                        className="text-sm text-gray-700"
                      >
                        完了済み
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateTodo(todo.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        保存
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  // 表示モード
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {todo.title}
                    </h3>
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
                        <span>
                          {new Date(todo.createdAt).toLocaleDateString("ja-JP")}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/todos/${todo.id}`}
                          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          詳細
                        </Link>
                        <button
                          onClick={() => startEdit(todo)}
                          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                        >
                          削除
                        </button>
                        <ReactionPicker
                          todoId={todo.id}
                          onReactionAdd={(emoji) => addReaction(todo.id, emoji)}
                        />
                      </div>
                    </div>
                    {/* リアクション表示 */}
                    {todo.reactions && todo.reactions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(
                          todo.reactions.reduce(
                            (acc, reaction) => {
                              acc[reaction.emoji] =
                                (acc[reaction.emoji] || 0) + 1;
                              return acc;
                            },
                            {} as Record<string, number>
                          )
                        ).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            onClick={() => removeReaction(todo.id, emoji)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200 transition-colors cursor-pointer"
                          >
                            <span>{emoji}</span>
                            <span className="text-gray-600">{count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
