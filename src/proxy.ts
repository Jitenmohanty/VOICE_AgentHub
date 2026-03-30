import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const path = req.nextUrl.pathname;

  // /a/* is public (customer-facing agent pages) — always allow
  if (path.startsWith("/a/")) {
    return NextResponse.next();
  }

  // /api/public/* is public — always allow
  if (path.startsWith("/api/public/")) {
    return NextResponse.next();
  }

  const isProtected =
    path.startsWith("/dashboard") ||
    path.startsWith("/business") ||
    path.startsWith("/agent/");

  const isAuth = path.startsWith("/login") || path.startsWith("/register");
  const isOnboarding = path === "/business/onboarding";

  // Redirect unauthenticated users to login
  if (isProtected && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }

  // Redirect logged-in users away from auth pages
  if (isAuth && isLoggedIn) {
    return Response.redirect(new URL("/business/dashboard", req.nextUrl));
  }

  // Redirect old /dashboard to /business/dashboard
  if (path === "/dashboard" && isLoggedIn) {
    return Response.redirect(new URL("/business/dashboard", req.nextUrl));
  }

  // Don't redirect if already on onboarding
  if (isOnboarding) {
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/business/:path*",
    "/agent/:path*",
    "/a/:path*",
    "/login",
    "/register",
  ],
};
