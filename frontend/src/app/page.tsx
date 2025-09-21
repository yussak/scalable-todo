"use client";

import { useState, useEffect, useTransition } from "react";
import { useAuth } from "./contexts/AuthContext";
import TodoForm from "./components/TodoForm";
import TodoItem from "./components/TodoItem";
import { getTodosAction, TodoWithUser } from "./actions/todos";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import api from "@/lib/api";
import { Todo } from "@/types/todo";

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();
  const [editingTodo, setEditingTodo] = useState<{
    id: string;
    title: string;
    description: string;
    completed: boolean;
  } | null>(null);
  const { user } = useAuth();

  const loadTodos = async (reset = false) => {
    if (!user?.id || loading) return;

    setLoading(true);
    try {
      startTransition(async () => {
        const result = await getTodosAction(
          user.id,
          reset ? undefined : cursor,
          20
        );

        const convertedTodos = result.todos.map((todo) => ({
          ...todo,
          user: { id: todo.user.id, email: todo.user.email },
        }));

        if (reset) {
          setTodos(convertedTodos);
        } else {
          setTodos((prev) => [...prev, ...convertedTodos]);
        }

        setHasMore(result.hasMore);
        setCursor(result.nextCursor);
      });
    } catch (error) {
      console.error("Failed to fetch todos:", error);
    } finally {
      setLoading(false);
    }
  };

  const { loadingElementRef } = useInfiniteScroll({
    hasMore,
    loading: loading || isPending,
    onLoadMore: () => loadTodos(false),
  });

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
        setCursor(undefined);
        loadTodos(true);
      }
    } catch (error) {
      console.error("Failed to create todo:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTodo = async (id: string) => {
    if (!user?.id) return;

    try {
      const response = await api.delete(`/todos/${id}`, {
        userId: user.id,
      });

      if (response.ok) {
        setTodos((prev) => prev.filter((todo) => todo.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingTodo({
      id: todo.id,
      title: todo.title,
      description: todo.description || "",
      completed: todo.completed,
    });
  };

  const cancelEdit = () => {
    setEditingTodo(null);
  };

  const updateTodo = async (id: string) => {
    if (!editingTodo?.title.trim() || !user?.id) return;

    try {
      const response = await api.put(`/todos/${id}`, {
        title: editingTodo.title.trim(),
        description: editingTodo.description.trim() || null,
        completed: editingTodo.completed,
        userId: user.id,
      });

      if (response.ok) {
        const updatedTodo = await response.json();
        setTodos((prev) =>
          prev.map((todo) => (todo.id === id ? updatedTodo : todo))
        );
        cancelEdit();
      }
    } catch (error) {
      console.error("Failed to update todo:", error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadTodos(true);
    }
  }, [user?.id]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editingTodo !== null) {
        cancelEdit();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [editingTodo]);

  const renderEditForm = (todo: Todo) => (
    <div className="space-y-4">
      <input
        type="text"
        value={editingTodo?.title || ""}
        onChange={(e) =>
          setEditingTodo((prev) =>
            prev ? { ...prev, title: e.target.value } : null
          )
        }
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
        placeholder="タイトル"
        autoFocus
      />
      <textarea
        value={editingTodo?.description || ""}
        onChange={(e) =>
          setEditingTodo((prev) =>
            prev ? { ...prev, description: e.target.value } : null
          )
        }
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
        placeholder="説明"
      />
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`completed-${todo.id}`}
          checked={editingTodo?.completed || false}
          onChange={(e) =>
            setEditingTodo((prev) =>
              prev ? { ...prev, completed: e.target.checked } : null
            )
          }
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
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <TodoForm
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          loading={loading || isPending}
          onSubmit={createTodo}
        />

        <div className="space-y-4">
          {todos.length === 0 && !loading ? (
            <div className="text-center text-gray-500 py-8">
              TODOがありません
            </div>
          ) : (
            <>
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  {editingTodo?.id === todo.id ? (
                    renderEditForm(todo)
                  ) : (
                    <TodoItem
                      todo={todo}
                      onEdit={startEdit}
                      onDelete={deleteTodo}
                    />
                  )}
                </div>
              ))}

              {/* 無限スクロール用のローディング要素 */}
              {hasMore && (
                <div
                  ref={loadingElementRef}
                  className="flex justify-center py-8"
                >
                  {(loading || isPending) && (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="text-gray-500">読み込み中...</span>
                    </div>
                  )}
                </div>
              )}

              {!hasMore && todos.length > 0 && (
                <div className="text-center text-gray-500 py-8">
                  すべてのTODOを読み込みました
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
