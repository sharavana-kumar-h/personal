import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getSessionSecret, sessionAudience, sessionIssuer } from "@/lib/session-secret";

const protectedPaths = ["/dashboard", "/today", "/workouts", "/nutrition", "/body", "/progress", "/goals", "/ai", "/settings"];

const publicPaths = ["/login", "/register", "/"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isPublic = publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!isProtected && !isPublic) {
    return NextResponse.next();
  }

  const token = request.cookies.get("fitness_session")?.value;

  if (!token) {
    if (isProtected) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  }

  try {
    await jwtVerify(token, getSessionSecret(), {
      issuer: sessionIssuer,
      audience: sessionAudience,
    });

    if (isPublic) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  } catch {
    const response = isProtected
      ? NextResponse.redirect(new URL("/login", request.url))
      : NextResponse.next();

    response.cookies.delete("fitness_session");
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico).*)",
  ],
};
