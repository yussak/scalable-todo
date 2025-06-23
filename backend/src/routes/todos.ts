import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const todo = await prisma.todo.create({
      data: {
        title,
        description: description || null,
      }
    });
    
    res.status(201).json(todo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

export default router;