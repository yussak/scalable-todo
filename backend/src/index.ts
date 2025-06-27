import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import todoRoutes from "./routes/todos.js";
import { authRouter } from "./routes/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3011;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Backend API is running!" });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("/api/todos", todoRoutes);
app.use("/api/auth", authRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
