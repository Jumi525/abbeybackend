"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentPost = exports.likePost = exports.getMyFeed = exports.getFeed = exports.createPost = void 0;
const postService = __importStar(require("../services/post.services"));
const createPost = async (req, res, next) => {
    try {
        const { content, media } = req.body;
        const userId = req.user.id;
        const post = await postService.createPost(userId, content, media);
        res.status(201).json(post);
    }
    catch (err) {
        next(err);
    }
};
exports.createPost = createPost;
const getFeed = async (req, res, next) => {
    try {
        const posts = await postService.getFeed();
        res.json(posts);
    }
    catch (err) {
        next(err);
    }
};
exports.getFeed = getFeed;
const getMyFeed = async (req, res, next) => {
    try {
        const posts = await postService.getMyFeed(req.user.id);
        res.json(posts);
    }
    catch (err) {
        next(err);
    }
};
exports.getMyFeed = getMyFeed;
const likePost = async (req, res, next) => {
    try {
        const { postId } = req.body;
        const result = await postService.toggleLike(req.user.id, postId);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
};
exports.likePost = likePost;
const commentPost = async (req, res, next) => {
    try {
        const { postId } = req.params;
        const { text } = req.body;
        const result = await postService.commentPost(req.user.id, postId, text);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
};
exports.commentPost = commentPost;
