import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware";
import client from "../utils/prisma";

const router = Router();

router.get("/me", requireAuth, async (req: any, res) => {
  try {
    const user = await client.user.findUnique({
      where: { id: req.user.id },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
            connections: true,
            Notification: true,
            posts: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      ...user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/me", requireAuth, async (req: any, res) => {
  const data = req.body;
  const user = await client.user.update({ where: { id: req.user.id }, data });
  res.json(user);
});

router.get("/:id", requireAuth, async (req, res) => {
  const user = await client.user.findUnique({ where: { id: req.params.id } });
  res.json(user);
});

export default router;
