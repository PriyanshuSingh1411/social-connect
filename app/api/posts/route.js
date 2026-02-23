import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import Post from "../../../models/Post";
import User from "../../../models/User";

// Get all posts (feed)
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;

    let query = {};

    // If userId provided, get posts from followed users
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        query = { userId: { $in: [...user.following, userId] } };
      }
    }

    const posts = await Post.find(query)
      .populate("userId", "name username profilePicture")
      .populate("comments.userId", "name username profilePicture")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Post.countDocuments(query);

    return NextResponse.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json(
      { message: "Error fetching posts" },
      { status: 500 },
    );
  }
}

// Create a new post
export async function POST(req) {
  try {
    await connectDB();

    const { userId, desc, img } = await req.json();

    if (!userId || !desc) {
      return NextResponse.json(
        { message: "User ID and description are required" },
        { status: 400 },
      );
    }

    // Extract hashtags from description
    const hashtags = desc.match(/#[a-zA-Z0-9_]+/g) || [];

    const post = await Post.create({
      userId,
      desc,
      img,
      hashtags: hashtags.map((tag) => tag.substring(1)),
    });

    const populatedPost = await Post.findById(post._id).populate(
      "userId",
      "name username profilePicture",
    );

    return NextResponse.json(
      { message: "Post created successfully", post: populatedPost },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { message: "Error creating post" },
      { status: 500 },
    );
  }
}
