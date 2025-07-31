export interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
  };
}
