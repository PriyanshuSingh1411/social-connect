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

    // The privacy check below decides whether to reveal a private
    // account's follower list, so it must be anchored to who is
    // actually logged in — not a client-supplied id, which would let
    // anyone bypass a private account's protection by simply claiming
    // to be one of its existing followers (any user id is visible in
    // that account's own profile URL).
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
