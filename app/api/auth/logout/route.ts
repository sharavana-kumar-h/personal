import { NextResponse } from "next/server";

import { logoutUser } from "@/app/actions/auth";

export async function POST(request: Request) {
  try {
    await logoutUser();
    return NextResponse.redirect(new URL("/login", request.url));
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
