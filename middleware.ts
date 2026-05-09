import { NextRequest, NextResponse } from "next/server";

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
    const response = NextResponse.next();
    response.headers.set("x-user-email", email);
    return response;
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/calendar/:path*", "/goals/:path*", "/finances/:path*", "/admin/:path*"],
};
