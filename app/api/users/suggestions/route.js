import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import User from "../../../../models/User";
import { getSessionUserId } from "../../../../lib/session";

export async function GET(req) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit")) || 5, 25);

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Get users that the current user is not following
    // and who are not the current user
    const suggestions = await User.find({
      _id: {
        $nin: [
          userId,
          ...(currentUser.following || []),
          ...(currentUser.blockedUsers || []),
        ],
      },
    })
      .select("name username profilePicture bio")
      .limit(limit);

    // Sort by number of mutual followers (fake algorithm for now)
    // In a real app, you'd calculate mutual followers
    const suggestionsWithScore = await Promise.all(
      suggestions.map(async (user) => {
        const mutualFollowers = await User.countDocuments({
          _id: { $in: user.followers },
          following: userId,
        });
        return {
          ...user.toObject(),
          mutualFollowers,
        };
      }),
    );

    // Sort by mutual followers (descending)
    suggestionsWithScore.sort((a, b) => b.mutualFollowers - a.mutualFollowers);

    return NextResponse.json({ users: suggestionsWithScore });
  } catch (error) {
    console.error("Get suggestions error:", error);
    return NextResponse.json(
      { message: "Error fetching suggestions" },
      { status: 500 },
    );
  }
}
