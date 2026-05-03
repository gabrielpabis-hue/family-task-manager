import { NextRequest, NextResponse } from "next/server";
import { getUserRole } from "@/lib/roles";

const ADMIN_PATHS = ["/goals"];

export async function middleware(req: NextRequest) {
  const sessionCookie = req.cookies.get("session")?.value;

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const verifyRes = await fetch(new URL("/api/auth/verify", req.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: sessionCookie }),
    });

    if (!verifyRes.ok) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const { email } = await verifyRes.json();
    const role = getUserRole(email);

    if (!role) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    const isAdminPath = ADMIN_PATHS.some((p) =>
      req.nextUrl.pathname.startsWith(p)
    );

    if (isAdminPath && role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    const response = NextResponse.next();
    response.headers.set("x-user-role", role);
    response.headers.set("x-user-email", email);
    return response;
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/calendar/:path*", "/goals/:path*", "/finances/:path*"],
};
