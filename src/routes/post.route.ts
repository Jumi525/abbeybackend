import { Router } from "express";
import {
  createPost,
  getFeed,
  likePost,
  commentPost,
  getMyFeed,
} from "../controllers/post.controller";
import { requireAuth } from "../middlewares/authMiddleware";

const router = Router();

router.post("/", requireAuth, createPost);
router.get("/feed", requireAuth, getFeed);
router.get("/my-feed", requireAuth, getMyFeed);
router.post("/like", requireAuth, likePost);
router.post("/comment/:postId", requireAuth, commentPost);

export default router;
