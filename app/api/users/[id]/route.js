import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import User from "../../../../models/User";
import Post from "../../../../models/Post";
import Notification from "../../../../models/Notification";

// Get user profile
export async function GET(req, { params }) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const currentUserId = searchParams.get("currentUserId");

    const user = await User.findById(params.id).select("-password");

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const posts = await Post.find({ userId: params.id })
      .populate("userId", "name username profilePicture")
      .sort({ createdAt: -1 });

    // Check follow status for current user
    let isFollowing = false;
    let isPending = false;
    let isFollowBack = false;

    if (currentUserId && currentUserId !== params.id) {
      const currentUser = await User.findById(currentUserId);
      if (currentUser) {
        isFollowing = currentUser.following.includes(params.id);

        // Check if there's a pending follow request
        const pendingNotification = await Notification.findOne({
          recipient: params.id,
          sender: currentUserId,
          type: "followRequest",
          status: "pending",
        });
        isPending = !!pendingNotification;

        // Check if the other user is following current user (for "follow back" logic)
        isFollowBack = user.following.includes(currentUserId);
      }
    }

    return NextResponse.json({
      user,
      posts,
      isFollowing,
      isPending,
      isFollowBack,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { message: "Error fetching user" },
      { status: 500 },
    );
  }
}

// Follow/Unfollow user and Update profile
export async function PUT(req, { params }) {
  try {
    await connectDB();

    const body = await req.json();
    const {
      currentUserId,
      type,
      name,
      bio,
      location,
      profilePicture,
      coverPicture,
      isPrivate,
    } = body;

    // Handle profile update
    if (type === "update") {
      if (currentUserId !== params.id) {
        return NextResponse.json(
          { message: "You can only update your own profile" },
          { status: 403 },
        );
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (bio !== undefined) updateData.bio = bio;
      if (location !== undefined) updateData.location = location;
      if (profilePicture !== undefined)
        updateData.profilePicture = profilePicture;
      if (coverPicture !== undefined) updateData.coverPicture = coverPicture;
      if (isPrivate !== undefined) updateData.isPrivate = isPrivate;

      const user = await User.findByIdAndUpdate(
        params.id,
        { $set: updateData },
        { new: true },
      ).select("-password");

      return NextResponse.json({ user });
    }

    // Handle follow/unfollow
    if (currentUserId === params.id) {
      return NextResponse.json(
        { message: "You cannot follow yourself" },
        { status: 400 },
      );
    }

    const userToFollow = await User.findById(params.id);
    const currentUser = await User.findById(currentUserId);

    if (!userToFollow || !currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (type === "follow") {
      const isFollowing = currentUser.following.includes(params.id);

      if (isFollowing) {
        // Unfollow
        currentUser.following = currentUser.following.filter(
          (id) => id.toString() !== params.id,
        );
        userToFollow.followers = userToFollow.followers.filter(
          (id) => id.toString() !== currentUserId,
        );

        // Also remove any pending follow request
        await Notification.findOneAndDelete({
          recipient: params.id,
          sender: currentUserId,
          type: "followRequest",
          status: "pending",
        });
      } else {
        // Check if user has private account
        if (userToFollow.isPrivate) {
          // Create follow request notification
          await Notification.create({
            recipient: params.id,
            sender: currentUserId,
            type: "followRequest",
            message: "wants to follow you",
            status: "pending",
          });

          await currentUser.save();
          await userToFollow.save();

          const updatedUser = await User.findById(params.id).select(
            "-password",
          );

          return NextResponse.json({
            user: updatedUser,
            isFollowing: false,
            isPending: true,
            message: "Follow request sent",
          });
        } else {
          // Direct follow for public accounts
          currentUser.following.push(params.id);
          userToFollow.followers.push(currentUserId);

          // Create notification
          await Notification.create({
            recipient: params.id,
            sender: currentUserId,
            type: "follow",
            message: "started following you",
          });
        }
      }
    }

    // Handle accept/reject follow request (for the recipient)
    if (type === "acceptRequest" || type === "rejectRequest") {
      const notification = await Notification.findOne({
        recipient: currentUserId,
        sender: params.id,
        type: "followRequest",
        status: "pending",
      });

      if (!notification) {
        return NextResponse.json(
          { message: "No pending follow request found" },
          { status: 404 },
        );
      }

      if (type === "acceptRequest") {
        // Add to followers
        const recipientUser = await User.findById(currentUserId);
        const senderUser = await User.findById(params.id);

        recipientUser.followers.push(params.id);
        senderUser.following.push(currentUserId);

        await recipientUser.save();
        await senderUser.save();

        // Update notification status
        notification.status = "accepted";
        notification.message = "accepted your follow request";
        await notification.save();

        // Create a new notification for the sender
        await Notification.create({
          recipient: params.id,
          sender: currentUserId,
          type: "follow",
          message: "accepted your follow request",
        });
      } else {
        // Reject - just update status
        notification.status = "rejected";
        await notification.save();
      }

      const updatedUser =
        await User.findById(currentUserId).select("-password");

      return NextResponse.json({
        user: updatedUser,
        isFollowing: type === "acceptRequest",
        message:
          type === "acceptRequest"
            ? "Follow request accepted"
            : "Follow request rejected",
      });
    }

    await currentUser.save();
    await userToFollow.save();

    const updatedUser = await User.findById(params.id).select("-password");

    return NextResponse.json({
      user: updatedUser,
      isFollowing: currentUser.following.includes(params.id),
    });
  } catch (error) {
    console.error("PUT user error:", error);
    return NextResponse.json(
      { message: "Error processing request" },
      { status: 500 },
    );
  }
}

// Update user profile
export async function PATCH(req, { params }) {
  try {
    await connectDB();

    const {
      userId,
      name,
      bio,
      location,
      profilePicture,
      coverPicture,
      isPrivate,
    } = await req.json();

    if (userId !== params.id) {
      return NextResponse.json(
        { message: "You can only update your own profile" },
        { status: 403 },
      );
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (profilePicture !== undefined)
      updateData.profilePicture = profilePicture;
    if (coverPicture !== undefined) updateData.coverPicture = coverPicture;
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate;

    const user = await User.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true },
    ).select("-password");

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { message: "Error updating profile" },
      { status: 500 },
    );
  }
}
