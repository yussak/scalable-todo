import { Router, Request, Response } from "express";
import { AuthController } from "../controllers/authController.js";

const authRouter = Router();
const authController = new AuthController();

authRouter.post("/register", (req: Request, res: Response) =>
  authController.register(req, res)
);

authRouter.post("/login", (req: Request, res: Response) =>
  authController.login(req, res)
);

export { authenticateToken } from "../middleware/auth.js";

export default authRouter;
