import { Response, NextFunction } from "express";
import * as postService from "../services/post.services";
import { AuthRequest } from "../middlewares/authMiddleware";

export const createPost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { content, media } = req.body;
    const userId = req.user!.id;
    const post = await postService.createPost(userId, content, media);
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
};

export const getFeed = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const posts = await postService.getFeed();
    res.json(posts);
  } catch (err) {
    next(err);
  }
};

export const getMyFeed = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const posts = await postService.getMyFeed(req.user!.id);
    res.json(posts);
  } catch (err) {
    next(err);
  }
};

export const likePost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { postId } = req.body;
    const result = await postService.toggleLike(req.user!.id, postId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const commentPost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const result = await postService.commentPost(req.user!.id, postId, text);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
