import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db";
import User from "../../../../../models/User";
import { getSessionUserId } from "../../../../../lib/session";
import { isValidObjectIdLike } from "../../../../../lib/validation";

export async function GET(req, { params }) {
  try {
    if (!isValidObjectIdLike(params.id)) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    await connectDB();

    const currentUserId = await getSessionUserId();

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
