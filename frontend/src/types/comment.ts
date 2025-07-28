export interface Comment {
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
