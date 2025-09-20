import client from "../utils/prisma";
import { hashPassword, comparePassword } from "../utils/hash";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";

type LoginResult = {
  accessToken: string;
  refreshToken: string;
  user: any;
};

export const registerUser = async (
  email: string,
  password: string,
  name?: string
) => {
  const existing = await client.user.findUnique({ where: { email } });
  if (existing) throw new Error("User already exists");

  const hashed = await hashPassword(password);
  const user = await client.user.create({
    data: { email, password: hashed, name },
  });
  return user;
};

export const loginWithCredentials = async (
  email: string,
  password: string,
  ip?: string,
  userAgent?: string
): Promise<LoginResult> => {
  const user = await client.user.findUnique({ where: { email } });
  if (!user || !user.password) throw new Error("Invalid credentials");

  const ok = await comparePassword(password, user.password);
  if (!ok) throw new Error("Invalid credentials");

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
  });
  const refreshToken = signRefreshToken({ sub: user.id });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await client.session.create({
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

export const loginWithProvider = async (
  email: string,
  name?: string,
  profilePhoto?: string,
  ip?: string,
  userAgent?: string
): Promise<LoginResult> => {
  const user = await client.user.upsert({
    where: { email },
    update: { name, profilePhoto },
    create: {
      email,
      name: name || "",
      profilePhoto: profilePhoto || "",
      password: "",
    },
  });

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
  });
  const refreshToken = signRefreshToken({ sub: user.id });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await client.session.create({
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

export const refreshTokens = async (
  refreshToken: string
): Promise<LoginResult> => {
  const payload: any = verifyRefreshToken(refreshToken) as any;
  const userId = payload.sub as string;
  if (!userId) throw new Error("Invalid token");

  const session = await client.session.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });
  if (!session || session.revoked) throw new Error("Invalid session");
  if (new Date(session.expiresAt) < new Date())
    throw new Error("Session expired");

  await client.session.update({
    where: { id: session.id },
    data: { revoked: true },
  });

  const newAccess = signAccessToken({
    sub: userId,
    email: session.user.email,
  });
  const newRefresh = signRefreshToken({ sub: userId });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await client.session.create({
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

export const logout = async (refreshToken: string) => {
  await client.session.updateMany({
    where: { token: refreshToken },
    data: { revoked: true },
  });
};
