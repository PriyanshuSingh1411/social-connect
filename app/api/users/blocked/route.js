import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import User from "../../../../models/User";
import { getSessionUserId } from "../../../../lib/session";

export async function GET(req) {
  try {
    // A block list is private to the person who made it — pull it from
    // the verified session, never a client-supplied userId, or anyone
    // could view anyone else's block list just by knowing their id.
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(userId).populate(
      "blockedUsers",
      "name username profilePicture",
    );

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ blockedUsers: user.blockedUsers || [] });
  } catch (error) {
    console.error("Get blocked users error:", error);
    return NextResponse.json(
      { message: "Error fetching blocked users" },
      { status: 500 },
    );
  }
}
