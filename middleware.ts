import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSupabaseEnv } from "@/lib/supabase/config";

const protectedPaths = ["/dashboard", "/today", "/workouts", "/nutrition", "/body", "/progress", "/goals", "/ai", "/settings"];
const publicPaths = ["/login", "/register", "/"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isPublic = publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!isProtected && !isPublic) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabaseEnv = getSupabaseEnv();
  const supabase = createServerClient(supabaseEnv.url, supabaseEnv.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublic && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico).*)"],
};
