"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.signRefreshToken = exports.verifyAccessToken = exports.signAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const ACCESS_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET;
const signAccessToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, ACCESS_SECRET, { expiresIn: "3d" });
};
exports.signAccessToken = signAccessToken;
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, ACCESS_SECRET);
};
exports.verifyAccessToken = verifyAccessToken;
const signRefreshToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, REFRESH_SECRET, { expiresIn: "30d" });
};
exports.signRefreshToken = signRefreshToken;
const verifyRefreshToken = (token) => {
    return jsonwebtoken_1.default.verify(token, REFRESH_SECRET);
};
exports.verifyRefreshToken = verifyRefreshToken;
