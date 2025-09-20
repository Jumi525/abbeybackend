"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const prisma_1 = __importDefault(require("../utils/prisma"));
const router = (0, express_1.Router)();
router.get("/me", authMiddleware_1.requireAuth, async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
});
router.patch("/me", authMiddleware_1.requireAuth, async (req, res) => {
    const data = req.body;
    const user = await prisma_1.default.user.update({ where: { id: req.user.id }, data });
    res.json(user);
});
router.get("/:id", authMiddleware_1.requireAuth, async (req, res) => {
    const user = await prisma_1.default.user.findUnique({ where: { id: req.params.id } });
    res.json(user);
});
exports.default = router;
