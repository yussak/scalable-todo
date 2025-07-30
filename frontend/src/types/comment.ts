export interface Comment {
  id: number;
  content: string;
  todoId: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
  };
}
