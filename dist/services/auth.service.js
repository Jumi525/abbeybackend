"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refreshTokens = exports.loginWithProvider = exports.loginWithCredentials = exports.registerUser = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const hash_1 = require("../utils/hash");
const jwt_1 = require("../utils/jwt");
const registerUser = async (email, password, name) => {
    const existing = await prisma_1.default.user.findUnique({ where: { email } });
    if (existing)
        throw new Error("User already exists");
    const hashed = await (0, hash_1.hashPassword)(password);
    const user = await prisma_1.default.user.create({
        data: { email, password: hashed, name },
    });
    return user;
};
exports.registerUser = registerUser;
const loginWithCredentials = async (email, password, ip, userAgent) => {
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    if (!user || !user.password)
        throw new Error("Invalid credentials");
    const ok = await (0, hash_1.comparePassword)(password, user.password);
    if (!ok)
        throw new Error("Invalid credentials");
    const accessToken = (0, jwt_1.signAccessToken)({
        sub: user.id,
        email: user.email,
    });
    const refreshToken = (0, jwt_1.signRefreshToken)({ sub: user.id });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await prisma_1.default.session.create({
        data: {
            userId: user.id,
            token: refreshToken,
            ip,
            userAgent,
            expiresAt,
        },
    });
    return { accessToken, refreshToken, user };
};
exports.loginWithCredentials = loginWithCredentials;
const loginWithProvider = async (email, name, profilePhoto, ip, userAgent) => {
    const user = await prisma_1.default.user.upsert({
        where: { email },
        update: { name, profilePhoto },
        create: {
            email,
            name: name || "",
            profilePhoto: profilePhoto || "",
            password: "",
        },
    });
    const accessToken = (0, jwt_1.signAccessToken)({
        sub: user.id,
        email: user.email,
    });
    const refreshToken = (0, jwt_1.signRefreshToken)({ sub: user.id });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await prisma_1.default.session.create({
        data: {
            userId: user.id,
            token: refreshToken,
            ip,
            userAgent,
            expiresAt,
        },
    });
    return { accessToken, refreshToken, user };
};
exports.loginWithProvider = loginWithProvider;
const refreshTokens = async (refreshToken) => {
    const payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
    const userId = payload.sub;
    if (!userId)
        throw new Error("Invalid token");
    const session = await prisma_1.default.session.findUnique({
        where: { token: refreshToken },
        include: { user: true },
    });
    if (!session || session.revoked)
        throw new Error("Invalid session");
    if (new Date(session.expiresAt) < new Date())
        throw new Error("Session expired");
    await prisma_1.default.session.update({
        where: { id: session.id },
        data: { revoked: true },
    });
    const newAccess = (0, jwt_1.signAccessToken)({
        sub: userId,
        email: session.user.email,
    });
    const newRefresh = (0, jwt_1.signRefreshToken)({ sub: userId });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await prisma_1.default.session.create({
        data: {
            userId,
            token: newRefresh,
            ip: session.ip,
            userAgent: session.userAgent,
            expiresAt,
        },
    });
    return {
        accessToken: newAccess,
        refreshToken: newRefresh,
        user: session.user,
    };
};
exports.refreshTokens = refreshTokens;
const logout = async (refreshToken) => {
    await prisma_1.default.session.updateMany({
        where: { token: refreshToken },
        data: { revoked: true },
    });
};
exports.logout = logout;
