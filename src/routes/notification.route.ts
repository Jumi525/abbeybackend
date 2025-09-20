import { Router } from "express";
import { notification } from "../controllers/notification.controller";
import { requireAuth } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", requireAuth, notification);

export default router;
