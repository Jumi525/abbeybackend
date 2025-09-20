"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const jwt_1 = require("../utils/jwt");
const requireAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader)
            return res.status(401).json({ message: "Unauthorized" });
        const token = authHeader.split(" ")[1];
        if (!token)
            return res.status(401).json({ message: "Unauthorized" });
        const payload = (0, jwt_1.verifyAccessToken)(token);
        req.user = { id: payload.sub, email: payload.email, role: payload.role };
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};
exports.requireAuth = requireAuth;
