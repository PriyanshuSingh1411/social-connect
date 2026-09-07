import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import Post from "../../../../models/Post";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit")) || 10;

    // Get hashtags with their counts from recent posts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const hashtagStats = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          hashtags: { $exists: true, $ne: [] },
        },
      },
      { $unwind: "$hashtags" },
      {
        $group: {
          _id: "$hashtags",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    // Also get the most recent post for each trending hashtag
    const trendingHashtags = await Promise.all(
      hashtagStats.map(async (tag) => {
        const latestPost = await Post.findOne({ hashtags: tag._id })
          .sort({ createdAt: -1 })
          .populate("userId", "name username profilePicture");

        return {
          tag: tag._id,
          count: tag.count,
          latestPost,
        };
      }),
    );

    return NextResponse.json({ hashtags: trendingHashtags });
  } catch (error) {
    console.error("Get trending hashtags error:", error);
    return NextResponse.json(
      { message: "Error fetching trending hashtags" },
      { status: 500 },
    );
  }
}
