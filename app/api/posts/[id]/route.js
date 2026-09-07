import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import Post from "../../../../models/Post";
import Notification from "../../../../models/Notification";
import User from "../../../../models/User";
import { getSessionUserId } from "../../../../lib/session";
import { isValidObjectIdLike } from "../../../../lib/validation";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// =====================================================
// CLOUDINARY PUBLIC ID
// =====================================================

function getCloudinaryPublicId(url) {
  if (!url || typeof url !== "string") {
    return null;
  }

  if (!url.includes("res.cloudinary.com")) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);

    const uploadIndex =
      parsedUrl.pathname.indexOf("/upload/");

    if (uploadIndex === -1) {
      return null;
    }

    let path = parsedUrl.pathname.substring(
      uploadIndex + "/upload/".length
    );

    path = path.replace(/^v\d+\//, "");
    path = path.replace(/\.[^/.]+$/, "");

    return path;
  } catch (error) {
    console.error(
      "Error extracting Cloudinary public ID:",
      error
    );

    return null;
  }
}


// =====================================================
// MENTION HELPERS
// =====================================================

function escapeRegex(value) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function extractMentionUsernames(text) {
  const matches =
    text.match(
      /@[a-zA-Z0-9_.-]+/g
    ) || [];

  return [
    ...new Set(
      matches.map((mention) =>
        mention.slice(1).toLowerCase()
      )
    ),
  ];
}


// =====================================================
// POPULATE POST
// =====================================================

function populatePost(query) {
  return query
    .populate(
      "userId",
      "name username profilePicture bio"
    )
    .populate(
      "comments.userId",
      "name username profilePicture"
    )
    .populate(
      "comments.mentions",
      "name username profilePicture"
    );
}


// =====================================================
// GET SINGLE POST
// =====================================================

export async function GET(req, { params }) {
  try {
    await connectDB();

    const post = await populatePost(
      Post.findById(params.id)
    );

    if (!post) {
      return NextResponse.json(
        { message: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error(
      "Get post error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Error fetching post",
      },
      { status: 500 }
    );
  }
}


// =====================================================
// UPDATE POST
// LIKE / BOOKMARK / EDIT / REACTION
// COMMENT / REPLY / DELETE COMMENT
// =====================================================

export async function PUT(req, { params }) {
  try {
    const userId =
      await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        {
          message:
            "Unauthorized",
        },
        { status: 401 }
      );
    }

    if (
      !isValidObjectIdLike(params.id)
    ) {
      return NextResponse.json(
        {
          message:
            "Post not found",
        },
        { status: 404 }
      );
    }

    await connectDB();

    const body = await req.json();

    const {
      type,
      commentText,
      parentCommentId,
      newDesc,
      newImg,
      reaction,
    } = body;

    const post =
      await Post.findById(params.id);

    if (!post) {
      return NextResponse.json(
        {
          message:
            "Post not found",
        },
        { status: 404 }
      );
    }


    // =================================================
    // LIKE
    // =================================================

    if (type === "like") {
      const isLiked =
        post.likes.includes(userId);

      if (isLiked) {
        post.likes =
          post.likes.filter(
            (id) =>
              id.toString() !== userId
          );
      } else {
        post.likes.push(userId);

        if (
          post.userId.toString() !==
          userId.toString()
        ) {
          await Notification.create({
            recipient: post.userId,
            sender: userId,
            type: "like",
            post: post._id,
            message:
              "liked your post",
          });
        }
      }
    }


    // =================================================
    // BOOKMARK
    // =================================================

    if (type === "bookmark") {
      const user =
        await User.findById(userId);

      if (!user) {
        return NextResponse.json(
          {
            message:
              "User not found",
          },
          { status: 404 }
        );
      }

      const isBookmarked =
        user.bookmarkedPosts.includes(
          params.id
        );

      if (isBookmarked) {
        user.bookmarkedPosts =
          user.bookmarkedPosts.filter(
            (id) =>
              id.toString() !==
              params.id
          );
      } else {
        user.bookmarkedPosts.push(
          params.id
        );
      }

      await user.save();

      return NextResponse.json({
        isBookmarked:
          !isBookmarked,
      });
    }


    // =================================================
    // EDIT POST
    // =================================================

    if (type === "edit") {
      if (
        post.userId.toString() !==
        userId.toString()
      ) {
        return NextResponse.json(
          {
            message:
              "You can only edit your own posts",
          },
          { status: 403 }
        );
      }

      if (
        newDesc !== undefined &&
        (
          typeof newDesc !==
            "string" ||
          newDesc.length > 5000
        )
      ) {
        return NextResponse.json(
          {
            message:
              "Post text must be 5000 characters or fewer",
          },
          { status: 400 }
        );
      }

      if (
        newDesc !== undefined
      ) {
        post.desc = newDesc;
      }

      if (
        newImg !== undefined
      ) {
        post.img = newImg;
      }

      post.isEdited = true;

      await post.save();

      const updatedPost =
        await populatePost(
          Post.findById(params.id)
        );

      return NextResponse.json({
        post: updatedPost,
      });
    }


    // =================================================
    // REACTION
    // =================================================

    if (type === "react") {
      const validReactions = [
        "like",
        "love",
        "haha",
        "wow",
        "sad",
        "angry",
      ];

      if (
        !validReactions.includes(
          reaction
        )
      ) {
        return NextResponse.json(
          {
            message:
              "Invalid reaction type",
          },
          { status: 400 }
        );
      }

      if (!post.reactions) {
        post.reactions =
          new Map();
      }

      if (!post.userReactions) {
        post.userReactions =
          new Map();
      }

      const userReactionKey =
        userId.toString();

      const currentUserReaction =
        post.userReactions.get(
          userReactionKey
        );

      // Same reaction = remove it
      if (
        currentUserReaction ===
        reaction
      ) {
        post.userReactions.delete(
          userReactionKey
        );

        const currentCount =
          post.reactions.get(
            reaction
          ) || 0;

        if (currentCount <= 1) {
          post.reactions.delete(
            reaction
          );
        } else {
          post.reactions.set(
            reaction,
            currentCount - 1
          );
        }

        post.likes =
          post.likes.filter(
            (id) =>
              id.toString() !==
              userId.toString()
          );
      }

      // Change reaction
      else {
        if (
          currentUserReaction
        ) {
          const oldCount =
            post.reactions.get(
              currentUserReaction
            ) || 0;

          if (oldCount <= 1) {
            post.reactions.delete(
              currentUserReaction
            );
          } else {
            post.reactions.set(
              currentUserReaction,
              oldCount - 1
            );
          }
        }

        const newCount =
          post.reactions.get(
            reaction
          ) || 0;

        post.reactions.set(
          reaction,
          newCount + 1
        );

        post.userReactions.set(
          userReactionKey,
          reaction
        );

        const alreadyLiked =
          post.likes.some(
            (id) =>
              id.toString() ===
              userId.toString()
          );

        if (!alreadyLiked) {
          post.likes.push(userId);
        }
      }

      await post.save();

      const updatedPost =
        await populatePost(
          Post.findById(params.id)
        );

      return NextResponse.json({
        post: updatedPost,
      });
    }


    // =================================================
    // NORMAL COMMENT
    // =================================================

    if (
      type === "comment" &&
      commentText !== undefined
    ) {
      if (
        typeof commentText !==
          "string" ||
        !commentText.trim()
      ) {
        return NextResponse.json(
          {
            message:
              "Comment cannot be empty",
          },
          { status: 400 }
        );
      }

      if (
        commentText.length > 1000
      ) {
        return NextResponse.json(
          {
            message:
              "Comment must be 1000 characters or fewer",
          },
          { status: 400 }
        );
      }

      const usernames =
        extractMentionUsernames(
          commentText
        );

      let mentionedUsers = [];

      if (
        usernames.length > 0
      ) {
        const queries =
          usernames.map(
            (username) => ({
              username: {
                $regex: `^${escapeRegex(
                  username
                )}$`,
                $options: "i",
              },
            })
          );

        mentionedUsers =
          await User.find({
            $or: queries,
          }).select(
            "_id name username profilePicture"
          );
      }

      const mentionedUserIds =
        mentionedUsers.map(
          (user) => user._id
        );

      post.comments.push({
        userId,
        text: commentText.trim(),
        parentCommentId: null,
        mentions:
          mentionedUserIds,
        createdAt: new Date(),
      });

      // Post owner notification
      if (
        post.userId.toString() !==
        userId.toString()
      ) {
        await Notification.create({
          recipient: post.userId,
          sender: userId,
          type: "comment",
          post: post._id,
          message:
            "commented on your post",
        });
      }

      // Mention notifications
      const notifications =
        mentionedUsers
          .filter(
            (user) =>
              user._id.toString() !==
              userId.toString()
          )
          .filter(
            (user) =>
              user._id.toString() !==
              post.userId.toString()
          )
          .map(
            (user) => ({
              recipient:
                user._id,
              sender: userId,
              type: "mention",
              post: post._id,
              message:
                "mentioned you in a comment",
            })
          );

      if (
        notifications.length > 0
      ) {
        await Notification.insertMany(
          notifications
        );
      }
    }


    // =================================================
    // REPLY
    // =================================================

    if (
      type === "reply" &&
      commentText !== undefined
    ) {
      if (
        typeof commentText !==
          "string" ||
        !commentText.trim()
      ) {
        return NextResponse.json(
          {
            message:
              "Reply cannot be empty",
          },
          { status: 400 }
        );
      }

      if (
        commentText.length > 1000
      ) {
        return NextResponse.json(
          {
            message:
              "Reply must be 1000 characters or fewer",
          },
          { status: 400 }
        );
      }

      if (
        !parentCommentId ||
        !isValidObjectIdLike(
          parentCommentId
        )
      ) {
        return NextResponse.json(
          {
            message:
              "Parent comment is required",
          },
          { status: 400 }
        );
      }

      const parentComment =
        post.comments.id(
          parentCommentId
        );

      if (!parentComment) {
        return NextResponse.json(
          {
            message:
              "Parent comment not found",
          },
          { status: 404 }
        );
      }

      const usernames =
        extractMentionUsernames(
          commentText
        );

      let mentionedUsers = [];

      if (
        usernames.length > 0
      ) {
        const queries =
          usernames.map(
            (username) => ({
              username: {
                $regex: `^${escapeRegex(
                  username
                )}$`,
                $options: "i",
              },
            })
          );

        mentionedUsers =
          await User.find({
            $or: queries,
          }).select(
            "_id name username profilePicture"
          );
      }

      const mentionedUserIds =
        mentionedUsers.map(
          (user) => user._id
        );

      post.comments.push({
        userId,
        text: commentText.trim(),
        parentCommentId,
        mentions:
          mentionedUserIds,
        createdAt: new Date(),
      });

      // Notify parent comment owner
      if (
        parentComment.userId &&
        parentComment.userId.toString() !==
          userId.toString()
      ) {
        await Notification.create({
          recipient:
            parentComment.userId,
          sender: userId,
          type: "reply",
          post: post._id,
          message:
            "replied to your comment",
        });
      }

      // Mention notifications
      const notifications =
        mentionedUsers
          .filter(
            (user) =>
              user._id.toString() !==
              userId.toString()
          )
          .filter(
            (user) =>
              !parentComment.userId ||
              user._id.toString() !==
                parentComment.userId.toString()
          )
          .map(
            (user) => ({
              recipient:
                user._id,
              sender: userId,
              type: "mention",
              post: post._id,
              message:
                "mentioned you in a reply",
            })
          );

      if (
        notifications.length > 0
      ) {
        await Notification.insertMany(
          notifications
        );
      }
    }


    // =================================================
    // DELETE COMMENT / REPLY
    // =================================================

    if (
      type === "deleteComment" &&
      commentText
    ) {
      const commentId =
        commentText;

      const comment =
        post.comments.id(
          commentId
        );

      if (!comment) {
        return NextResponse.json(
          {
            message:
              "Comment not found",
          },
          { status: 404 }
        );
      }

      // Only owner can delete
      if (
        comment.userId.toString() !==
        userId.toString()
      ) {
        return NextResponse.json(
          {
            message:
              "You can only delete your own comments",
          },
          { status: 403 }
        );
      }

      // Delete the selected comment
      // and all children beneath it.
      const idsToDelete =
        new Set([commentId]);

      let foundChild = true;

      while (foundChild) {
        foundChild = false;

        post.comments.forEach(
          (item) => {
            const parentId =
              item.parentCommentId?.toString();

            const itemId =
              item._id.toString();

            if (
              parentId &&
              idsToDelete.has(
                parentId
              ) &&
              !idsToDelete.has(
                itemId
              )
            ) {
              idsToDelete.add(
                itemId
              );

              foundChild = true;
            }
          }
        );
      }

      post.comments =
        post.comments.filter(
          (item) =>
            !idsToDelete.has(
              item._id.toString()
            )
        );
    }


    // =================================================
    // SAVE COMMENT / REPLY CHANGES
    // =================================================

    await post.save();

    const updatedPost =
      await populatePost(
        Post.findById(params.id)
      );

    return NextResponse.json({
      post: updatedPost,
    });
  } catch (error) {
    console.error(
      "Update post error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Error updating post",
      },
      { status: 500 }
    );
  }
}


// =====================================================
// DELETE POST
// =====================================================

export async function DELETE(
  req,
  { params }
) {
  try {
    const userId =
      await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        {
          message:
            "Unauthorized",
        },
        { status: 401 }
      );
    }

    if (
      !isValidObjectIdLike(params.id)
    ) {
      return NextResponse.json(
        {
          message:
            "Post not found",
        },
        { status: 404 }
      );
    }

    await connectDB();

    const post =
      await Post.findById(params.id);

    if (!post) {
      return NextResponse.json(
        {
          message:
            "Post not found",
        },
        { status: 404 }
      );
    }

    if (
      post.userId.toString() !==
      userId.toString()
    ) {
      return NextResponse.json(
        {
          message:
            "You can only delete your own posts",
        },
        { status: 403 }
      );
    }

    // =================================================
    // DELETE CLOUDINARY IMAGES
    // =================================================

    const cloudinaryUrls = [];

    if (post.img) {
      cloudinaryUrls.push(
        post.img
      );
    }

    if (
      Array.isArray(post.images)
    ) {
      cloudinaryUrls.push(
        ...post.images
      );
    }

    for (
      const imageUrl of
      cloudinaryUrls
    ) {
      const publicId =
        getCloudinaryPublicId(
          imageUrl
        );

      if (!publicId) {
        continue;
      }

      try {
        const result =
          await cloudinary.uploader.destroy(
            publicId,
            {
              resource_type:
                "image",
              invalidate: true,
            }
          );

        console.log(
          `Cloudinary delete: ${publicId} → ${result.result}`
        );

        if (
          result.result !== "ok" &&
          result.result !==
            "not found"
        ) {
          throw new Error(
            `Cloudinary failed to delete ${publicId}: ${result.result}`
          );
        }
      } catch (
        cloudinaryError
      ) {
        console.error(
          `Failed to delete Cloudinary image ${publicId}:`,
          cloudinaryError
        );

        return NextResponse.json(
          {
            message:
              "Could not delete the post image from Cloudinary. The post was not deleted.",
          },
          { status: 500 }
        );
      }
    }

    await Post.findByIdAndDelete(
      params.id
    );

    return NextResponse.json({
      message:
        "Post and Cloudinary image deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete post error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Error deleting post",
      },
      { status: 500 }
    );
  }
}