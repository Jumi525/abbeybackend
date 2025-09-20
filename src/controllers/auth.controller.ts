import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, name } = req.body;
    const user = await authService.registerUser(email, password, name);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, method, profilePhoto, name } = req.body;
    const ip = req.ip;
    const userAgent = req.get("User-Agent") || undefined;
    if (method === "provider") {
      const { accessToken, refreshToken, user } =
        await authService.loginWithProvider(
          email,
          name,
          profilePhoto,
          ip,
          userAgent
        );

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/auth/refresh",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      return res.json({ accessToken, user });
    } else {
      const { accessToken, refreshToken, user } =
        await authService.loginWithCredentials(email, password, ip, userAgent);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/auth/refresh",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      return res.json({ accessToken, user });
    }
  } catch (err) {
    next(err);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.refreshToken as string | undefined;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const { accessToken, refreshToken, user } = await authService.refreshTokens(
      token
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/refresh",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({ accessToken, user });
  } catch (err) {
    next(err);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.refreshToken as string | undefined;
    if (token) await authService.logout(token);
    res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
    res.json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
};
