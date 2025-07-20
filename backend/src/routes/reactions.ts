import { Router } from "express";
import { authenticateToken } from "./auth.js";
import { ReactionController } from "../controllers/reactionController.js";

const router = Router();

// POST /api/todos/:id/reactions - リアクション追加
router.post("/:id/reactions", authenticateToken, async (req, res) => {
  await ReactionController.addReaction(req, res);
});

// GET /api/todos/:id/reactions - リアクション一覧取得
router.get("/:id/reactions", async (req, res) => {
  // TODO: getReactions実装後に追加
  res.status(501).json({ error: "Not implemented yet" });
});

// DELETE /api/todos/:id/reactions - リアクション削除（トグル）
router.delete("/:id/reactions", authenticateToken, async (req, res) => {
  // TODO: removeReaction実装後に追加
  res.status(501).json({ error: "Not implemented yet" });
});

export default router;
