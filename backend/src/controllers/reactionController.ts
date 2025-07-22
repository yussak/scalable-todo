import { ReactionModel } from "../models/Reaction.js";

export const ReactionController = {
  addReaction: async (req: any, res: any) => {
    const todoId = parseInt(req.params.id);
    const userId = req.user.id;
    const emoji = req.body.emoji;

    const reaction = await ReactionModel.create({
      todoId,
      userId,
      emoji,
    });

    res.status(201).json(reaction);
  },

  getReactions: async (req: any, res: any) => {
    const todoId = parseInt(req.params.id);
    const reactions = await ReactionModel.findByTodo(todoId);
    res.json(reactions);
  },
};
