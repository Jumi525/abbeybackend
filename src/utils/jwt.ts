import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const ACCESS_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET as string;
const REFRESH_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET as string;

export const signAccessToken = (payload: object) => {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "3d" });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, ACCESS_SECRET);
};

export const signRefreshToken = (payload: object) => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "30d" });
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, REFRESH_SECRET);
};
