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

    // Check privacy - if account is private, only show to followers or own profile
    if (user.isPrivate) {
      // Allow if viewing own profile
      if (currentUserId && currentUserId === params.id) {
        // Own profile - allow access
      } else if (!currentUserId) {
        return NextResponse.json(
          { message: "This account is private", users: [] },
          { status: 200 },
        );
      } else {
        // Check if current user is following this user
        const currentUser = await User.findById(currentUserId);
        if (!currentUser || !currentUser.following.includes(params.id)) {
          return NextResponse.json(
            { message: "This account is private", users: [] },
            { status: 200 },
          );
        }
      }
    }

    // Get followers with user details
    const followers = await User.find({
      _id: { $in: user.followers },
    }).select("name username profilePicture");

    return NextResponse.json({ users: followers });
  } catch (error) {
    console.error("Get followers error:", error);
    return NextResponse.json(
      { message: "Error fetching followers" },
      { status: 500 },
    );
  }
}
