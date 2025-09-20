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
exports.logout = exports.refresh = exports.login = exports.register = void 0;
const authService = __importStar(require("../services/auth.service"));
const register = async (req, res, next) => {
    try {
        const { email, password, name } = req.body;
        const user = await authService.registerUser(email, password, name);
        res.status(201).json({ user });
    }
    catch (err) {
        next(err);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password, method, profilePhoto, name } = req.body;
        const ip = req.ip;
        const userAgent = req.get("User-Agent") || undefined;
        if (method === "provider") {
            const { accessToken, refreshToken, user } = await authService.loginWithProvider(email, name, profilePhoto, ip, userAgent);
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/api/auth/refresh",
                maxAge: 30 * 24 * 60 * 60 * 1000,
            });
            return res.json({ accessToken, user });
        }
        else {
            const { accessToken, refreshToken, user } = await authService.loginWithCredentials(email, password, ip, userAgent);
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/api/auth/refresh",
                maxAge: 30 * 24 * 60 * 60 * 1000,
            });
            return res.json({ accessToken, user });
        }
    }
    catch (err) {
        next(err);
    }
};
exports.login = login;
const refresh = async (req, res, next) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token)
            return res.status(401).json({ message: "No refresh token" });
        const { accessToken, refreshToken, user } = await authService.refreshTokens(token);
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/api/auth/refresh",
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        return res.json({ accessToken, user });
    }
    catch (err) {
        next(err);
    }
};
exports.refresh = refresh;
const logout = async (req, res, next) => {
    try {
        const token = req.cookies?.refreshToken;
        if (token)
            await authService.logout(token);
        res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
        res.json({ message: "Logged out" });
    }
    catch (err) {
        next(err);
    }
};
exports.logout = logout;
