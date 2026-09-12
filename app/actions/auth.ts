"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/validation";

function authError() {
  return new Error("Invalid email or password.");
}

export async function registerUser(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid registration data.");
  }

  const email = parsed.data.email.toLowerCase();
  const limit = consumeRateLimit(`register:${email}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    throw new Error("Too many registration attempts. Please try again later.");
  }

  if (await prisma.user.count() >= 2) {
    throw new Error("Registration is closed.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: parsed.data.password,
    options: { data: { name: parsed.data.name || null } },
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Registration failed.");
  }
  const authUser = data.user;

  try {
    await prisma.$transaction(async (tx) => {
      if (await tx.user.count() >= 2) {
        throw new Error("Registration is closed.");
      }

      await tx.user.create({
        data: {
          supabaseAuthId: authUser.id,
          email,
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
  } catch {
    await supabase.auth.signOut();
    throw new Error("Registration could not be completed.");
  }

  redirect(data.session ? "/dashboard" : "/login?checkEmail=1");
}

export async function loginUser(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    throw authError();
  }

  const email = parsed.data.email.toLowerCase();
  const limit = consumeRateLimit(`login:${email}`, 10, 15 * 60 * 1000);
  if (!limit.allowed) {
    throw new Error("Too many login attempts. Please try again later.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: parsed.data.password });
  if (error) {
    throw authError();
  }

  const user = await getSessionUser();
  if (!user) {
    await supabase.auth.signOut();
    throw authError();
  }

  redirect("/dashboard");
}

export async function logoutUser() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
