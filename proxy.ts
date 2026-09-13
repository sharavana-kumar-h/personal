import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { measurePerformance } from "@/lib/perf";
import { getSupabaseEnv } from "@/lib/supabase/config";

const protectedPaths = ["/dashboard", "/today", "/workouts", "/nutrition", "/body", "/progress", "/goals", "/ai", "/settings"];
const publicPaths = ["/login", "/register", "/"];

export async function proxy(request: NextRequest) {
  const requestId = crypto.randomUUID();
  return measurePerformance("proxy.request", { requestId }, () => handleProxy(request, requestId));
}

async function handleProxy(request: NextRequest, requestId: string) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isPublic = publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!isProtected && !isPublic) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);
  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const supabaseEnv = getSupabaseEnv();
  const supabase = createServerClient(supabaseEnv.url, supabaseEnv.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        requestHeaders.set("cookie", request.cookies.toString());
        response = NextResponse.next({ request: { headers: requestHeaders } });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await measurePerformance("proxy.auth.getUser", { requestId }, () => supabase.auth.getUser());

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