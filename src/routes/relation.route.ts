import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware";
import * as relationController from "../controllers/relation.controller";

const router = Router();

router.post(
  "/connect/request",
  requireAuth,
  relationController.sendConnectionRequest
);
router.post(
  "/connect/respond",
  requireAuth,
  relationController.respondConnectionRequest
);
router.get("/discover", requireAuth, relationController.discoverUsers);
router.get(
  "/connections",
  requireAuth,
  relationController.getPendingConnections
);
router.get(
  "/followers",
  requireAuth,
  relationController.getFollowingConnections
);
router.get("/following", requireAuth, relationController.listFollowing);
export default router;
