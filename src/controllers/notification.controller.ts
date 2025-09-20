import { NextFunction, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import client from "../utils/prisma";

export const notification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const notificationCount = await client.notification.count({
      where: {
        recipientId: userId,
      },
    });

    if (!notificationCount) {
      return res.status(404).json({ message: "No notification Found" });
    }

    res.status(200).json({ count: notificationCount });
  } catch (err) {
    next(err);
  }
};
