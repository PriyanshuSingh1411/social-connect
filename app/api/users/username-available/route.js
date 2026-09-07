import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import User from "../../../../models/User";
import { checkRateLimit, getClientIp } from "../../../../lib/rateLimit";

const USERNAME_RE = /^[a-zA-Z0-9_.]{3,30}$/;

// Intentionally public (no session required) since this backs the
// signup form's live availability check, before the person has an
// account. It only ever returns a boolean — never anything else about
// a matching account — so it can't be used to enumerate user data
// beyond "is this exact username taken", which the signup flow already
// exposes anyway.
export async function GET(req) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`username-check:${ip}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { message: "Too many requests" },
        { status: 429 },
      );
    }

    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username") || "";

    if (!USERNAME_RE.test(username)) {
      return NextResponse.json({ available: false, invalid: true });
    }

    await connectDB();
    const existing = await User.exists({ username });

    return NextResponse.json({ available: !existing });
  } catch (error) {
    console.error("Username availability check error:", error);
    return NextResponse.json(
      { message: "Error checking username" },
      { status: 500 },
    );
  }
}
