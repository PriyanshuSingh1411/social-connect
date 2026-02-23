import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import Notification from "../../../models/Notification";

// Get notifications
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 },
      );
    }

    const notifications = await Notification.find({ recipient: userId })
      .populate("sender", "name username profilePicture")
      .populate("post", "desc img")
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false,
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json(
      { message: "Error fetching notifications" },
      { status: 500 },
    );
  }
}

// Mark notifications as read
export async function PUT(req) {
  try {
    await connectDB();

    const { userId } = await req.json();

    await Notification.updateMany(
      { recipient: userId, read: false },
      { $set: { read: true } },
    );

    return NextResponse.json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("Mark read error:", error);
    return NextResponse.json(
      { message: "Error marking notifications as read" },
      { status: 500 },
    );
  }
}
