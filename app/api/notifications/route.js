import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import Notification from "../../../models/Notification";
import Post from "../../../models/Post";
import { getSessionUserId } from "../../../lib/session";

// Get notifications
export async function GET(req) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const notifications = await Notification.find({
      recipient: userId,
    })
      .select("sender type post message read createdAt")
      .populate("sender", "name username profilePicture")
      .populate("post", "desc")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false,
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    return NextResponse.json(
      { message: "Error fetching notifications" },
      { status: 500 }
    );
  }
}

// Mark notifications as read
export async function PUT(req) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    await Notification.updateMany(
      {
        recipient: userId,
        read: false,
      },
      {
        $set: {
          read: true,
        },
      }
    );

    return NextResponse.json({
      message: "Notifications marked as read",
    });
  } catch (error) {
    console.error("Mark read error:", error);

    return NextResponse.json(
      { message: "Error marking notifications as read" },
      { status: 500 }
    );
  }
}