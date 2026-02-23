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

    const messages = await Message.find({
      $or: [{ sender: session.user.id }, { receiver: session.user.id }],
    })
      .populate("sender", "name username profilePicture")
      .populate("receiver", "name username profilePicture")
      .sort({ createdAt: -1 });

    // Group messages by conversation partner
    const conversations = {};

    messages.forEach((msg) => {
      const partnerId =
        msg.sender._id.toString() === session.user.id
          ? msg.receiver._id.toString()
          : msg.sender._id.toString();

      if (!conversations[partnerId]) {
        conversations[partnerId] = {
          partner:
            msg.sender._id.toString() === session.user.id
              ? msg.receiver
              : msg.sender,
          lastMessage: msg,
          unreadCount: 0,
        };
      }

      if (msg.receiver._id.toString() === session.user.id && !msg.read) {
        conversations[partnerId].unreadCount++;
      }
    });

    const conversationList = Object.values(conversations);

    return NextResponse.json(conversationList);
  } catch (error) {
    console.error("Get conversations error:", error);
    return NextResponse.json(
      { message: "Error fetching conversations" },
      { status: 500 },
    );
  }
}
