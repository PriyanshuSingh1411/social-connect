import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import User from "../../../../models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";

// Set typing status
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { receiverId, isTyping } = await req.json();

    if (isTyping) {
      // Add user to receiver's typing list
      const expiresAt = new Date(Date.now() + 5000); // 5 seconds expiry

      await User.findByIdAndUpdate(receiverId, {
        $push: {
          typingUsers: {
            userId: session.user.id,
            expiresAt: expiresAt,
          },
        },
      });
    } else {
      // Remove user from receiver's typing list
      await User.findByIdAndUpdate(receiverId, {
        $pull: {
          typingUsers: { userId: session.user.id },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Typing indicator error:", error);
    return NextResponse.json(
      { message: "Error updating typing status" },
      { status: 500 },
    );
  }
}

// Get typing users
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Find current user and get typing users
    const user = await User.findById(session.user.id)
      .populate("typingUsers.userId", "name username profilePicture")
      .select("typingUsers");

    if (!user) {
      return NextResponse.json({ typingUsers: [] });
    }

    // Filter out expired typing users and limit to 10
    const now = new Date();
    const activeTypingUsers = user.typingUsers
      .filter((u) => u.expiresAt > now && u.userId)
      .slice(0, 10); // Limit to 10 users max

    // Clean up expired users from database
    if (user.typingUsers.length > activeTypingUsers.length) {
      await User.findByIdAndUpdate(session.user.id, {
        $pull: {
          typingUsers: { expiresAt: { $lt: now } },
        },
      });
    }

    return NextResponse.json({ typingUsers: activeTypingUsers });
  } catch (error) {
    console.error("Get typing users error:", error);
    return NextResponse.json(
      { message: "Error fetching typing users" },
      { status: 500 },
    );
  }
}
