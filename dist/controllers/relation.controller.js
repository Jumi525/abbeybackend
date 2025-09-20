"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFollowingConnections = exports.getPendingConnections = exports.discoverUsers = exports.listFollowing = exports.listFollowers = exports.respondConnectionRequest = exports.sendConnectionRequest = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const kafka_1 = require("../utils/kafka");
const appError_1 = __importDefault(require("../utils/appError"));
const NOTIF_TOPIC = process.env.NOTIFICATION_TOPIC || "notifications";
const sendConnectionRequest = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { targetId } = req.body;
        if (userId === targetId) {
            return res
                .status(400)
                .json({ message: "You cannot send a connection request to yourself." });
        }
        const existing = await prisma_1.default.connection.findUnique({
            where: { userId_targetId: { userId, targetId } },
        });
        if (existing) {
            return res
                .status(400)
                .json({ message: "Connection request already exists." });
        }
        const request = await prisma_1.default.connection.create({
            data: { userId, targetId, status: "PENDING" },
        });
        const event = {
            type: "FRIEND_REQUEST",
            actorId: userId,
            recipientId: targetId,
            meta: {},
            createdAt: new Date().toISOString(),
        };
        (0, kafka_1.publishEvent)(NOTIF_TOPIC, event).catch((err) => console.error("Failed to publish FRIEND_REQUEST event:", err));
        res.json(request);
    }
    catch (err) {
        next(err);
    }
};
exports.sendConnectionRequest = sendConnectionRequest;
const respondConnectionRequest = async (req, res, next) => {
    try {
        const { requestId } = req.body;
        const userId = req.user.id;
        const { action } = req.body; // "accept" | "reject"
        if (action === "accept") {
            console.log(action, "actions");
            const updated = await prisma_1.default.connection.update({
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
            (0, kafka_1.publishEvent)(NOTIF_TOPIC, event).catch((err) => console.error("Failed to publish REQUEST_ACCEPTED event:", err));
            res.json(updated);
        }
        else {
            await prisma_1.default.connection.delete({ where: { id: requestId } });
            const event = {
                type: "REQUEST_REJECTED",
                actorId: requestId,
                recipientId: userId,
                meta: { response: "Rejected" },
                createdAt: new Date().toISOString(),
            };
            (0, kafka_1.publishEvent)(NOTIF_TOPIC, event).catch((err) => console.error("Failed to publish REQUEST_REJECTED event:", err));
            res.json({ message: "Rejected" });
        }
    }
    catch (err) {
        next(err);
    }
};
exports.respondConnectionRequest = respondConnectionRequest;
const listFollowers = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const followers = await prisma_1.default.follower.findMany({
            where: { followingId: userId },
            include: { follower: true },
        });
        if (!followers) {
            throw new appError_1.default("Followers is Empty", 404);
        }
        res.json(followers);
    }
    catch (err) {
        next(err);
    }
};
exports.listFollowers = listFollowers;
const listFollowing = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const following = await prisma_1.default.follower.findMany({
            where: { followerId: userId },
            include: { following: true },
        });
        if (!following) {
            throw new appError_1.default("Following is Empty", 404);
        }
        res.json(following);
    }
    catch (err) {
        next(err);
    }
};
exports.listFollowing = listFollowing;
const discoverUsers = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const connectedOrPendingUserIds = await prisma_1.default.connection.findMany({
            where: {
                OR: [{ userId: userId }, { targetId: userId }],
            },
            select: {
                userId: true,
                targetId: true,
            },
        });
        const relatedUserIds = new Set();
        connectedOrPendingUserIds.forEach((conn) => {
            relatedUserIds.add(conn.userId);
            relatedUserIds.add(conn.targetId);
        });
        relatedUserIds.add(userId);
        const discoverableUsers = await prisma_1.default.user.findMany({
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
    }
    catch (err) {
        next(err);
    }
};
exports.discoverUsers = discoverUsers;
const getPendingConnections = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const pendingConnections = await prisma_1.default.connection.findMany({
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
    }
    catch (err) {
        next(err);
    }
};
exports.getPendingConnections = getPendingConnections;
const getFollowingConnections = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const pendingConnections = await prisma_1.default.connection.findMany({
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
    }
    catch (err) {
        next(err);
    }
};
exports.getFollowingConnections = getFollowingConnections;
