"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notification = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const notification = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const notificationCount = await prisma_1.default.notification.count({
            where: {
                recipientId: userId,
            },
        });
        if (!notificationCount) {
            return res.status(404).json({ message: "No notification Found" });
        }
        res.status(200).json({ count: notificationCount });
    }
    catch (err) {
        next(err);
    }
};
exports.notification = notification;
