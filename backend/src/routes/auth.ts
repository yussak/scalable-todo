import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma.js";
import { AuthController } from "../controllers/authController.js";

const authRouter = Router();
const authController = new AuthController();

const JWT_SECRET = process.env.JWT_SECRET || "secret";

// 認証ミドルウェア
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({ error: "Access token required" });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true },
    });

    if (!user) {
      res.status(403).json({ error: "Invalid or expired token" });
      return;
    }

    (req as any).user = user;
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid or expired token" });
    return;
  }
};

authRouter.post("/register", (req: Request, res: Response) =>
  authController.register(req, res)
);

authRouter.post("/login", (req: Request, res: Response) =>
  authController.login(req, res)
);

export default authRouter;
