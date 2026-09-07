import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import Story from "../../../../models/Story";
import Message from "../../../../models/Message";
import Notification from "../../../../models/Notification";
import { getSessionUserId } from "../../../../lib/session";
import { isValidObjectIdLike } from "../../../../lib/validation";

// Get a single story with populated commenters/viewers, and whether
// the requester is its owner (the frontend needs this to decide
// whether to show delete/viewer-list controls or the comment/reply
// controls — a story only ever shows one set, never both).
export async function GET(req, { params }) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isValidObjectIdLike(params.id)) {
      return NextResponse.json({ message: "Story not found" }, { status: 404 });
    }

    await connectDB();

    const story = await Story.findById(params.id)
      .populate("userId", "name username profilePicture")
      .populate("comments.userId", "name username profilePicture")
      // Viewer identities are only ever sent back to the story's own
      // owner (see the isOwner check below) — populating here is safe
      // because the response strips it out for everyone else.
      .populate("views", "name username profilePicture");

    if (!story) {
      return NextResponse.json({ message: "Story not found" }, { status: 404 });
    }

    const isOwner = story.userId._id.toString() === userId;

    return NextResponse.json({
      story: {
        _id: story._id,
        userId: story.userId,
        media: story.media,
        mediaType: story.mediaType,
        comments: story.comments,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
        // Viewer list is private to the story's owner — everyone else
        // gets a count only, never the identities.
        viewCount: story.views.length,
        views: isOwner ? story.views : undefined,
      },
      isOwner,
    });
  } catch (error) {
    console.error("Get story error:", error);
    return NextResponse.json(
      { message: "Error fetching story" },
      { status: 500 },
    );
  }
}

// Record a view, add a public comment, or send a private reply
export async function PUT(req, { params }) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isValidObjectIdLike(params.id)) {
      return NextResponse.json({ message: "Story not found" }, { status: 404 });
    }

    await connectDB();

    const story = await Story.findById(params.id);
    if (!story) {
      return NextResponse.json({ message: "Story not found" }, { status: 404 });
    }

    const { type, text } = await req.json();
    const isOwner = story.userId.toString() === userId;

    if (type === "view") {
      // Viewing your own story isn't a "view" in the sense the owner
      // cares about (who saw this), so it's simply a no-op rather than
      // an error — the frontend can call this unconditionally without
      // needing to check ownership first.
      if (isOwner) {
        return NextResponse.json({ message: "Own story, not recorded" });
      }
      if (!story.views.some((v) => v.toString() === userId)) {
        story.views.push(userId);
        await story.save();
      }
      return NextResponse.json({ message: "View recorded" });
    }

    if (type === "comment") {
      if (isOwner) {
        return NextResponse.json(
          { message: "You can't comment on your own story" },
          { status: 400 },
        );
      }
      if (typeof text !== "string" || text.trim().length === 0) {
        return NextResponse.json(
          { message: "Comment text is required" },
          { status: 400 },
        );
      }
      if (text.length > 500) {
        return NextResponse.json(
          { message: "Comment must be 500 characters or fewer" },
          { status: 400 },
        );
      }

      story.comments.push({ userId, text: text.trim() });
      await story.save();

      await Notification.create({
        recipient: story.userId,
        sender: userId,
        type: "story_comment",
        story: story._id,
        message: "commented on your story",
      });

      const updated = await Story.findById(story._id).populate(
        "comments.userId",
        "name username profilePicture",
      );

      return NextResponse.json({
        message: "Comment added",
        comments: updated.comments,
      });
    }

    if (type === "reply") {
      // A private reply is deliberately NOT stored on the story at
      // all — it becomes a real Message through the same system every
      // other DM uses, so it shows up in the recipient's actual
      // Messages inbox rather than a separate story-replies list.
      if (isOwner) {
        return NextResponse.json(
          { message: "You can't reply to your own story" },
          { status: 400 },
        );
      }
      if (typeof text !== "string" || text.trim().length === 0) {
        return NextResponse.json(
          { message: "Reply text is required" },
          { status: 400 },
        );
      }
      if (text.length > 1000) {
        return NextResponse.json(
          { message: "Reply must be 1000 characters or fewer" },
          { status: 400 },
        );
      }

      const message = await Message.create({
        sender: userId,
        receiver: story.userId,
        content: text.trim(),
        storyReply: {
          story: story._id,
          // Snapshotted now, not just referenced, since the story
          // itself may auto-expire and delete within 24 hours — the
          // reply should keep showing its context in the recipient's
          // inbox even after the original story is gone.
          media: story.media,
        },
      });

      await Notification.create({
        recipient: story.userId,
        sender: userId,
        type: "story_reply",
        story: story._id,
        message: "replied to your story",
      });

      const populatedMessage = await Message.findById(message._id)
        .populate("sender", "name username profilePicture")
        .populate("receiver", "name username profilePicture");

      return NextResponse.json({
        message: "Reply sent",
        sentMessage: populatedMessage,
      });
    }

    return NextResponse.json({ message: "Invalid action type" }, { status: 400 });
  } catch (error) {
    console.error("Update story error:", error);
    return NextResponse.json(
      { message: "Error updating story" },
      { status: 500 },
    );
  }
}

// Delete a story — owner only
export async function DELETE(req, { params }) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isValidObjectIdLike(params.id)) {
      return NextResponse.json({ message: "Story not found" }, { status: 404 });
    }

    await connectDB();

    const story = await Story.findById(params.id);
    if (!story) {
      return NextResponse.json({ message: "Story not found" }, { status: 404 });
    }

    if (story.userId.toString() !== userId) {
      return NextResponse.json(
        { message: "You can only delete your own stories" },
        { status: 403 },
      );
    }

    // Deleting a story removes it and its public comments (embedded
    // on the document, so they go with it). Private replies are real
    // Messages by this point and are intentionally left alone — the
    // same way deleting a post doesn't unsend a DM someone sent you
    // about it.
    await Story.findByIdAndDelete(params.id);

    return NextResponse.json({ message: "Story deleted successfully" });
  } catch (error) {
    console.error("Delete story error:", error);
    return NextResponse.json(
      { message: "Error deleting story" },
      { status: 500 },
    );
  }
}
