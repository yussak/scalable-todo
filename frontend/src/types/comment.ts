export interface Comment {
  id: number;
  content: string;
  todoId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
  };
}
