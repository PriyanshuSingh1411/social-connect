import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import Message from "../../../models/Message";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const messages = await Message.find({
      $or: [
        { sender: session.user.id, receiver: userId },
        { sender: userId, receiver: session.user.id },
      ],
      $nor: [{ deletedFor: session.user.id }, { isDeletedForEveryone: true }],
    })
      .populate("sender", "name username profilePicture")
      .populate("receiver", "name username profilePicture")
      .sort({ createdAt: 1 });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { message: "Error fetching messages" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { receiverId, content, image } = await req.json();

    const message = await Message.create({
      sender: session.user.id,
      receiver: receiverId,
      content,
      image,
    });

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name username profilePicture")
      .populate("receiver", "name username profilePicture");

    return NextResponse.json(populatedMessage);
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { message: "Error sending message" },
      { status: 500 },
    );
  }
}

// Mark messages as read
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { senderId } = await req.json();

    // Mark all messages from sender as read
    await Message.updateMany(
      { sender: senderId, receiver: session.user.id, read: false },
      { $set: { read: true } },
    );

    return NextResponse.json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Mark as read error:", error);
    return NextResponse.json(
      { message: "Error marking messages as read" },
      { status: 500 },
    );
  }
}
