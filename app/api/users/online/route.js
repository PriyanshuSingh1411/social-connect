import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import User from "../../../../models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";

// Set user online status
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { isOnline } = await req.json();

    await User.findByIdAndUpdate(session.user.id, {
      isOnline: isOnline,
      lastSeen: isOnline ? null : new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Online status error:", error);
    return NextResponse.json(
      { message: "Error updating online status" },
      { status: 500 },
    );
  }
}

// Get online users
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const userIds = searchParams.get("userIds")?.split(",");

    if (!userIds || userIds.length === 0) {
      return NextResponse.json({ users: [] });
    }

    const users = await User.find({ _id: { $in: userIds } })
      .select("_id isOnline lastSeen")
      .limit(50); // Limit to 50 users max

    const onlineStatus = {};
    users.forEach((user) => {
      onlineStatus[user._id.toString()] = {
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      };
    });

    return NextResponse.json(onlineStatus);
  } catch (error) {
    console.error("Get online users error:", error);
    return NextResponse.json(
      { message: "Error fetching online status" },
      { status: 500 },
    );
  }
}
