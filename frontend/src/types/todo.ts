export interface Todo {
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
}
