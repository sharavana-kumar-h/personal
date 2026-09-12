"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { createUserSession, deleteUserSessions, getSessionUser, hashPassword, sessionCookieName, verifyPassword } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { loginSchema, registerSchema } from "@/lib/validation";

export async function registerUser(formData: FormData) {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = registerSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid registration data.");
  }

  const registrationLimit = consumeRateLimit(`register:${parsed.data.email.toLowerCase()}`, 5, 15 * 60 * 1000);
  if (!registrationLimit.allowed) {
    throw new Error("Too many registration attempts. Please try again later.");
  }

  const user = await prisma.$transaction(async (tx) => {
    if (await tx.user.count() >= 2) {
      throw new Error("Registration is closed.");
    }

    const existing = await tx.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    if (existing) {
      throw new Error("An account with that email already exists.");
    }

    return tx.user.create({
      data: {
        email: parsed.data.email.toLowerCase(),
        passwordHash: await hashPassword(parsed.data.password),
        name: parsed.data.name || null,
        profile: {
          create: {
            displayName: parsed.data.name || null,
            unitSystem: "metric",
          },
        },
      },
    });
  }, { isolationLevel: "Serializable" });

  const token = await createUserSession(user.id);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/dashboard");
}

export async function loginUser(formData: FormData) {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = loginSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid login data.");
  }

  const loginLimit = consumeRateLimit(`login:${parsed.data.email.toLowerCase()}`, 10, 15 * 60 * 1000);
  if (!loginLimit.allowed) {
    throw new Error("Too many login attempts. Please try again later.");
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const validPassword = await verifyPassword(parsed.data.password, user.passwordHash);

  if (!validPassword) {
    throw new Error("Invalid email or password.");
  }

  const token = await createUserSession(user.id);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/dashboard");
}

export async function logoutUser() {
  const user = await getSessionUser();

  if (user) {
    await deleteUserSessions(user.id);
  }

  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);

  redirect("/login");
}
