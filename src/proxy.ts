import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard");
  const isOnAgent = req.nextUrl.pathname.startsWith("/agent/");
  const isOnAuth =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register");

  if ((isOnDashboard || isOnAgent) && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }

  if (isOnAuth && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/agent/:path*", "/login", "/register"],
};
