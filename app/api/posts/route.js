import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import Post from "../../../models/Post";
import User from "../../../models/User";
import { getSessionUserId } from "../../../lib/session";
import { isValidObjectIdLike } from "../../../lib/validation";

// Get all posts (feed)
// Get all posts (feed)
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const page = Math.max(
      parseInt(searchParams.get("page")) || 1,
      1
    );

    const limit = Math.min(
      parseInt(searchParams.get("limit")) || 10,
      20
    );

    const sessionUserId = await getSessionUserId();

    let query = {};

    if (sessionUserId) {
      const user = await User.findById(sessionUserId)
        .select("following")
        .lean();

      if (user) {
        query = {
          userId: {
            $in: [
              ...(user.following || []),
              sessionUserId,
            ],
          },
        };
      }
    }

    const posts = await Post.find(query)
      .select(
        "userId desc img images video likes reactions userReactions createdAt updatedAt hashtags mentions sharedPost"
      )
      .populate(
        "userId",
        "name username profilePicture"
      )
      .populate(
        "sharedPost",
        "userId desc img createdAt"
      )
      .populate(
        "sharedPost.userId",
        "name username profilePicture"
      )
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

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
      { status: 500 }
    );
  }
}

// Create a new post or share a post
export async function POST(req) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { desc, img, sharedPostId, images, video } = await req.json();

    if (desc !== undefined && (typeof desc !== "string" || desc.length > 5000)) {
      return NextResponse.json(
        { message: "Post text must be 5000 characters or fewer" },
        { status: 400 },
      );
    }

    // If sharing a post
    if (sharedPostId) {
      if (!isValidObjectIdLike(sharedPostId)) {
        return NextResponse.json(
          { message: "Post not found" },
          { status: 404 },
        );
      }

      const originalPost = await Post.findById(sharedPostId);
      if (!originalPost) {
        return NextResponse.json(
          { message: "Post not found" },
          { status: 404 },
        );
      }

      // Create share post
      const sharePost = await Post.create({
        userId,
        desc: desc || "",
        img: img || "",
        sharedPost: sharedPostId,
      });

      // Add to original post's shares
      originalPost.shares.push(userId);
      await originalPost.save();

      // Create notification for original post owner
      const Notification = (await import("../../../models/Notification"))
        .default;
      if (originalPost.userId.toString() !== userId) {
        await Notification.create({
          recipient: originalPost.userId,
          sender: userId,
          type: "share",
          post: originalPost._id,
          message: "shared your post",
        });
      }

      const populatedPost = await Post.findById(sharePost._id)
        .populate("userId", "name username profilePicture")
        .populate("sharedPost", "userId desc img")
        .populate("sharedPost.userId", "name username profilePicture");

      return NextResponse.json(
        { message: "Post shared successfully", post: populatedPost },
        { status: 201 },
      );
    }

    // Regular post creation
    if (!desc && !img && !images) {
      return NextResponse.json(
        { message: "Post content is required" },
        { status: 400 },
      );
    }

    // Extract hashtags from description
    const hashtags = desc ? desc.match(/#[a-zA-Z0-9_]+/g) || [] : [];

    // Extract mentions from description (@username)
    const mentionMatches = desc ? desc.match(/@([a-zA-Z0-9_]+)/g) || [] : [];
    const mentionUsernames = mentionMatches.map((m) => m.substring(1));

    // Find mentioned users
    const mentionedUsers = await User.find({
      username: { $in: mentionUsernames },
    });

    const postData = {
      userId,
      desc: desc || "",
      hashtags: hashtags.map((tag) => tag.substring(1)),
      mentions: mentionedUsers.map((u) => u._id),
    };

    // Handle single image
    if (img) {
      postData.img = img;
    }

    // Handle multiple images (carousel)
    if (images && images.length > 0) {
      postData.images = images;
    }

    // Handle video
    if (video) {
      postData.video = video;
    }

    const post = await Post.create(postData);

    // Create notifications for mentioned users
    const Notification = (await import("../../../models/Notification")).default;
    for (const mentionedUser of mentionedUsers) {
      if (mentionedUser._id.toString() !== userId) {
        await Notification.create({
          recipient: mentionedUser._id,
          sender: userId,
          type: "mention",
          post: post._id,
          message: "mentioned you in a post",
        });
      }
    }

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
