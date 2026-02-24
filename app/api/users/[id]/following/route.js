import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db";
import User from "../../../../../models/User";

export async function GET(req, { params }) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const currentUserId = searchParams.get("currentUserId");

    const user = await User.findById(params.id).select("-password");

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check privacy - if account is private, only show to followers
    if (user.isPrivate) {
      if (!currentUserId) {
        return NextResponse.json(
          { message: "This account is private", users: [] },
          { status: 200 },
        );
      }

      // Check if current user is following this user
      const currentUser = await User.findById(currentUserId);
      if (!currentUser || !currentUser.following.includes(params.id)) {
        return NextResponse.json(
          { message: "This account is private", users: [] },
          { status: 200 },
        );
      }
    }

    // Get following with user details
    const following = await User.find({
      _id: { $in: user.following },
    }).select("name username profilePicture");

    return NextResponse.json({ users: following });
  } catch (error) {
    console.error("Get following error:", error);
    return NextResponse.json(
      { message: "Error fetching following" },
      { status: 500 },
    );
  }
}
