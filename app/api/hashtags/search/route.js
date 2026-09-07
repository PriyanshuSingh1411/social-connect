import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import Post from "../../../../models/Post";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const tag = searchParams.get("tag");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;

    if (!tag) {
      return NextResponse.json(
        { message: "Tag parameter is required" },
        { status: 400 },
      );
    }

    const posts = await Post.find({ hashtags: tag })
      .populate("userId", "name username profilePicture")
      .populate("comments.userId", "name username profilePicture")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Post.countDocuments({ hashtags: tag });

    return NextResponse.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      tag,
    });
  } catch (error) {
    console.error("Search by hashtag error:", error);
    return NextResponse.json(
      { message: "Error searching posts by hashtag" },
      { status: 500 },
    );
  }
}
