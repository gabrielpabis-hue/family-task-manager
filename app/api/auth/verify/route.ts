import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    const decoded = await adminAuth.verifySessionCookie(token, true);
    return NextResponse.json({ email: decoded.email });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}