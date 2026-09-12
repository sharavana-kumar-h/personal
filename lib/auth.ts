import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

import { prisma } from "@/lib/db";
import { getSessionSecret, sessionAudience, sessionIssuer } from "@/lib/session-secret";

export const sessionCookieName = "fitness_session";

export function assertUserOwnership(currentUserId: string, resourceUserId: string) {
  if (currentUserId !== resourceUserId) {
    throw new Error("Unauthorized");
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function createSessionToken(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(sessionIssuer)
    .setAudience(sessionAudience)
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSessionSecret());
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      issuer: sessionIssuer,
      audience: sessionAudience,
    });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function createUserSession(userId: string) {
  const token = await createSessionToken(userId);
  const tokenHash = await bcrypt.hash(token, 12);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  return token;
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  const userId = await verifySessionToken(token);

  if (!userId) {
    return null;
  }

  const sessions = await prisma.session.findMany({
    where: {
      userId,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  for (const session of sessions) {
    const matches = await bcrypt.compare(token, session.tokenHash);
    if (matches) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true },
      });

      return user;
    }
  }

  return null;
}

export async function requireUser() {
  const user = await getSessionUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function deleteUserSessions(userId: string) {
  await prisma.session.deleteMany({
    where: { userId },
  });
}
