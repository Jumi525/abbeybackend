"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentPost = exports.toggleLike = exports.getMyFeed = exports.getFeed = exports.createPost = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const kafka_1 = require("../utils/kafka");
const appError_1 = __importDefault(require("../utils/appError"));
const NOTIF_TOPIC = process.env.NOTIFICATION_TOPIC || "notifications";
const createPost = async (authorId, content, media = []) => {
    return prisma_1.default.post.create({
        data: { authorId, content, media },
    });
};
exports.createPost = createPost;
const getFeed = async () => {
    const posts = await prisma_1.default.post.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            author: true,
            _count: {
                select: {
                    likes: true,
                    comments: true,
                },
            },
        },
    });
    if (!posts.length) {
        throw new appError_1.default("Post not found", 404);
    }
    return posts;
};
exports.getFeed = getFeed;
const getMyFeed = async (userId) => {
    const posts = await prisma_1.default.post.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        include: {
            author: true,
            _count: {
                select: {
                    likes: true,
                    comments: true,
                },
            },
        },
    });
    if (!posts.length) {
        throw new appError_1.default("Your Feed is Empty", 404);
    }
    return posts;
};
exports.getMyFeed = getMyFeed;
const toggleLike = async (userId, postId) => {
    const post = await prisma_1.default.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
    });
    if (!post) {
        throw new appError_1.default("Post not found", 404);
    }
    if (post.authorId === userId) {
        throw new appError_1.default("You cannot like your own post", 400);
    }
    const existingLike = await prisma_1.default.like.findUnique({
        where: {
            userId_postId: {
                userId,
                postId,
            },
        },
    });
    if (existingLike) {
        const unlike = await prisma_1.default.like.delete({
            where: {
                id: existingLike.id,
            },
        });
        const event = {
            type: "UNLIKE",
            actorId: userId,
            recipientId: post.authorId,
            postId,
            meta: {},
            createdAt: new Date().toISOString(),
        };
        (0, kafka_1.publishEvent)(NOTIF_TOPIC, event).catch((err) => console.error("Failed to publish LIKE event:", err));
        return { liked: false, unlike };
    }
    else {
        const like = await prisma_1.default.like.create({
            data: { userId, postId },
        });
        const event = {
            type: "LIKE",
            actorId: userId,
            recipientId: post.authorId,
            postId,
            meta: {},
            createdAt: new Date().toISOString(),
        };
        (0, kafka_1.publishEvent)(NOTIF_TOPIC, event).catch((err) => console.error("Failed to publish LIKE event:", err));
        return { liked: true, like };
    }
};
exports.toggleLike = toggleLike;
const commentPost = async (userId, postId, text) => {
    const post = await prisma_1.default.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
    });
    if (!post)
        throw new appError_1.default("Post not found", 404);
    if (post.authorId === userId) {
        throw new appError_1.default("You cannot comment on your own post", 400);
    }
    const comment = await prisma_1.default.comment.create({
        data: { userId, postId, text },
    });
    const event = {
        type: "COMMENT",
        actorId: userId,
        recipientId: post.authorId,
        postId,
        meta: { commentId: comment.id, text: text.slice(0, 200) },
        createdAt: new Date().toISOString(),
    };
    (0, kafka_1.publishEvent)(NOTIF_TOPIC, event).catch((err) => console.error("Failed to publish COMMENT event:", err));
    return comment;
};
exports.commentPost = commentPost;
