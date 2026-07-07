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

    // Bookmark/Unbookmark a post
    if (type === "bookmark") {
      const User = (await import("../../../../models/User")).default;
      const user = await User.findById(userId);

      if (!user) {
        return NextResponse.json(
          { message: "User not found" },
          { status: 404 },
        );
      }

      const isBookmarked = user.bookmarkedPosts.includes(params.id);

      if (isBookmarked) {
        user.bookmarkedPosts = user.bookmarkedPosts.filter(
          (id) => id.toString() !== params.id,
        );
      } else {
        user.bookmarkedPosts.push(params.id);
      }

      await user.save();

      // Return after saving, don't continue
      return NextResponse.json({
        isBookmarked: !isBookmarked,
      });
    }

    // Edit a post
    if (type === "edit") {
      const { newDesc, newImg } = await req.json();

      // Check if user is the owner
      if (post.userId.toString() !== userId) {
        return NextResponse.json(
          { message: "You can only edit your own posts" },
          { status: 403 },
        );
      }

      // Update the post
      if (newDesc !== undefined) post.desc = newDesc;
      if (newImg !== undefined) post.img = newImg;
      post.isEdited = true;

      await post.save();

      const updatedPost = await Post.findById(params.id)
        .populate("userId", "name username profilePicture")
        .populate("comments.userId", "name username profilePicture");

      return NextResponse.json({ post: updatedPost });
    }

    // React to a post (like, love, haha, wow, sad, angry)
    if (type === "react") {
      const { reaction } = await req.json();
      const validReactions = ["like", "love", "haha", "wow", "sad", "angry"];

      if (!validReactions.includes(reaction)) {
        return NextResponse.json(
          { message: "Invalid reaction type" },
          { status: 400 },
        );
      }

      // Initialize reactions map if not exists
      if (!post.reactions) {
        post.reactions = {};
      }

      // Remove existing reaction from this user (we track in likes array for simplicity)
      const existingReactionIndex = post.likes.findIndex(
        (r) => r.userId?.toString?.() === userId || r === userId,
      );

      // For simplicity, we'll use a different approach - store reaction in a separate field
      // Check if user already reacted
      const userReactionKey = `user_${userId}`;
      const currentUserReaction = post.reactions.get
        ? post.reactions.get(userReactionKey)
        : post.reactions[userReactionKey];

      if (currentUserReaction === reaction) {
        // User clicked same reaction - remove it
        if (post.reactions.delete) {
          post.reactions.delete(userReactionKey);
        } else {
          delete post.reactions[userReactionKey];
        }
        post.reactions[reaction] = (post.reactions[reaction] || 0) - 1;
      } else {
        // Add new reaction or change reaction
        if (currentUserReaction) {
          // Decrease old reaction count
          post.reactions[currentUserReaction] = Math.max(
            0,
            (post.reactions[currentUserReaction] || 1) - 1,
          );
        }
        // Increase new reaction count
        post.reactions[reaction] = (post.reactions[reaction] || 0) + 1;
        // Store user's reaction
        post.reactions[userReactionKey] = reaction;
      }

      // Also update likes array for backward compatibility
      const likeIndex = post.likes.findIndex((id) => id.toString() === userId);
      if (likeIndex === -1) {
        post.likes.push(userId);
      }

      await post.save();

      const updatedPost = await Post.findById(params.id)
        .populate("userId", "name username profilePicture")
        .populate("comments.userId", "name username profilePicture");

      return NextResponse.json({
        post: updatedPost,
        reactions: post.reactions,
      });
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

    if (type === "deleteComment" && commentText) {
      const commentId = commentText;
      const comment = post.comments.find((c) => c._id.toString() === commentId);

      if (!comment) {
        return NextResponse.json(
          { message: "Comment not found" },
          { status: 404 },
        );
      }

      // Check if user is the comment owner
      if (comment.userId.toString() !== userId) {
        return NextResponse.json(
          { message: "You can only delete your own comments" },
          { status: 403 },
        );
      }

      post.comments = post.comments.filter(
        (c) => c._id.toString() !== commentId,
      );
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
