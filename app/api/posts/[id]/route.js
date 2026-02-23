import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import Post from "../../../../models/Post";
import Notification from "../../../../models/Notification";

// Get a single post
export async function GET(req, { params }) {
  try {
    await connectDB();

    const post = await Post.findById(params.id)
      .populate("userId", "name username profilePicture bio")
      .populate("comments.userId", "name username profilePicture");

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json(
      { message: "Error fetching post" },
      { status: 500 },
    );
  }
}

// Update post (like, unlike, add comment)
export async function PUT(req, { params }) {
  try {
    await connectDB();

    const { userId, type, commentText } = await req.json();
    const post = await Post.findById(params.id);

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    if (type === "like") {
      const isLiked = post.likes.includes(userId);

      if (isLiked) {
        post.likes = post.likes.filter((id) => id.toString() !== userId);
      } else {
        post.likes.push(userId);

        // Create notification
        if (post.userId.toString() !== userId) {
          await Notification.create({
            recipient: post.userId,
            sender: userId,
            type: "like",
            post: post._id,
            message: "liked your post",
          });
        }
      }
    }

    if (type === "comment" && commentText) {
      post.comments.push({
        userId,
        text: commentText,
        createdAt: new Date(),
      });

      // Create notification
      if (post.userId.toString() !== userId) {
        await Notification.create({
          recipient: post.userId,
          sender: userId,
          type: "comment",
          post: post._id,
          message: "commented on your post",
        });
      }
    }

    await post.save();

    const updatedPost = await Post.findById(params.id)
      .populate("userId", "name username profilePicture")
      .populate("comments.userId", "name username profilePicture");

    return NextResponse.json({ post: updatedPost });
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json(
      { message: "Error updating post" },
      { status: 500 },
    );
  }
}

// Delete a post
export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const post = await Post.findById(params.id);

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    // Check if user is the owner
    if (post.userId.toString() !== userId) {
      return NextResponse.json(
        { message: "You can only delete your own posts" },
        { status: 403 },
      );
    }

    await Post.findByIdAndDelete(params.id);

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json(
      { message: "Error deleting post" },
      { status: 500 },
    );
  }
}
