import { Response, NextFunction } from "express";
import client from "../utils/prisma";
import { AuthRequest } from "../middlewares/authMiddleware";
import { publishEvent } from "../utils/kafka";
import AppError from "../utils/appError";
const NOTIF_TOPIC = process.env.NOTIFICATION_TOPIC || "notifications";

export const sendConnectionRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { targetId } = req.body;

    if (userId === targetId) {
      return res
        .status(400)
        .json({ message: "You cannot send a connection request to yourself." });
    }

    const existing = await client.connection.findUnique({
      where: { userId_targetId: { userId, targetId } },
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "Connection request already exists." });
    }

    const request = await client.connection.create({
      data: { userId, targetId, status: "PENDING" },
    });

    const event = {
      type: "FRIEND_REQUEST",
      actorId: userId,
      recipientId: targetId,
      meta: {},
      createdAt: new Date().toISOString(),
    };

    publishEvent(NOTIF_TOPIC, event).catch((err) =>
      console.error("Failed to publish FRIEND_REQUEST event:", err)
    );

    res.json(request);
  } catch (err) {
    next(err);
  }
};

export const respondConnectionRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { requestId } = req.body;
    const userId = req.user!.id;
    const { action } = req.body; // "accept" | "reject"
    if (action === "accept") {
      console.log(action, "actions");
      const updated = await client.connection.update({
        where: { id: requestId },
        data: { status: "CONNECTED" },
      });
      const event = {
        type: "REQUEST_ACCEPTED",
        actorId: requestId,
        recipientId: userId,
        meta: { response: "accept" },
        createdAt: new Date().toISOString(),
      };
      publishEvent(NOTIF_TOPIC, event).catch((err) =>
        console.error("Failed to publish REQUEST_ACCEPTED event:", err)
      );
      res.json(updated);
    } else {
      await client.connection.delete({ where: { id: requestId } });
      const event = {
        type: "REQUEST_REJECTED",
        actorId: requestId,
        recipientId: userId,
        meta: { response: "Rejected" },
        createdAt: new Date().toISOString(),
      };
      publishEvent(NOTIF_TOPIC, event).catch((err) =>
        console.error("Failed to publish REQUEST_REJECTED event:", err)
      );
      res.json({ message: "Rejected" });
    }
  } catch (err) {
    next(err);
  }
};

export const listFollowers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const followers = await client.follower.findMany({
      where: { followingId: userId },
      include: { follower: true },
    });
    if (!followers) {
      throw new AppError("Followers is Empty", 404);
    }
    res.json(followers);
  } catch (err) {
    next(err);
  }
};

export const listFollowing = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const following = await client.follower.findMany({
      where: { followerId: userId },
      include: { following: true },
    });
    if (!following) {
      throw new AppError("Following is Empty", 404);
    }
    res.json(following);
  } catch (err) {
    next(err);
  }
};

export const discoverUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const connectedOrPendingUserIds = await client.connection.findMany({
      where: {
        OR: [{ userId: userId }, { targetId: userId }],
      },
      select: {
        userId: true,
        targetId: true,
      },
    });

    const relatedUserIds = new Set<string>();
    connectedOrPendingUserIds.forEach((conn) => {
      relatedUserIds.add(conn.userId);
      relatedUserIds.add(conn.targetId);
    });

    relatedUserIds.add(userId);

    const discoverableUsers = await client.user.findMany({
      where: {
        id: {
          notIn: Array.from(relatedUserIds),
        },
      },
      select: {
        id: true,
        name: true,
        headline: true,
        location: true,
        bio: true,
        profilePhoto: true,
        _count: {
          select: {
            connections: true,
            followers: true,
          },
        },
      },
      take: 20,
    });

    res.json(discoverableUsers);
  } catch (err) {
    next(err);
  }
};

export const getPendingConnections = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const pendingConnections = await client.connection.findMany({
      where: {
        status: {
          not: "CONNECTED",
        },
        OR: [
          {
            userId: userId,
          },
          {
            targetId: userId,
          },
        ],
      },
      include: {
        user: true,
        target: true,
      },
    });

    res.json(pendingConnections);
  } catch (err) {
    next(err);
  }
};

export const getFollowingConnections = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const pendingConnections = await client.connection.findMany({
      where: {
        status: {
          equals: "CONNECTED",
        },
        OR: [
          {
            userId: userId,
          },
          {
            targetId: userId,
          },
        ],
      },
      include: {
        user: true,
        target: true,
      },
    });

    res.json(pendingConnections);
  } catch (err) {
    next(err);
  }
};
