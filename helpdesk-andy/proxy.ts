import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Get the session via Auth.js
  const session = await auth();
  const { pathname } = request.nextUrl;
  const isLoggedIn = !!session?.user;
  const role = session?.user?.role;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isStaffPage = pathname.startsWith("/staff");
  const isTicketsPage = pathname.startsWith("/tickets");
  const isApiAuth = pathname.startsWith("/api/auth");

  // Allow API auth routes
  if (isApiAuth) return NextResponse.next();

  // Redirect logged-in users away from auth pages
  if (isAuthPage && isLoggedIn) {
    if (role === "CUSTOMER") {
      return NextResponse.redirect(new URL("/tickets", request.url));
    }
    return NextResponse.redirect(new URL("/staff/tickets", request.url));
  }

  // Protect ticket pages - require login
  if (isTicketsPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Protect staff pages - require AGENT or ADMIN role
  if (isStaffPage) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (role === "CUSTOMER") {
      return NextResponse.redirect(new URL("/tickets", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
