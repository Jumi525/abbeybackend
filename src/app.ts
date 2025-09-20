import express from "express";
import { config } from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middlewares/errorHandler";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import postRoutes from "./routes/post.route";
import relationRoutes from "./routes/relation.route";
import notificationRoutes from "./routes/notification.route";
import cookieParser from "cookie-parser";
config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/relations", relationRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(errorHandler);

export default app;
