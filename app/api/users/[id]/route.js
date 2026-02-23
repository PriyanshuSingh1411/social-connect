import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import User from "../../../../models/User";
import Post from "../../../../models/Post";
import Notification from "../../../../models/Notification";

// Get user profile
export async function GET(req, { params }) {
  try {
    await connectDB();

    const user = await User.findById(params.id).select("-password");

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const posts = await Post.find({ userId: params.id })
      .populate("userId", "name username profilePicture")
      .sort({ createdAt: -1 });

    return NextResponse.json({ user, posts });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { message: "Error fetching user" },
      { status: 500 },
    );
  }
}

// Follow/Unfollow user
export async function PUT(req, { params }) {
  try {
    await connectDB();

    const { currentUserId, type } = await req.json();

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
        currentUser.following = currentUser.following.filter(
          (id) => id.toString() !== params.id,
        );
        userToFollow.followers = userToFollow.followers.filter(
          (id) => id.toString() !== currentUserId,
        );
      } else {
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

    await currentUser.save();
    await userToFollow.save();

    const updatedUser = await User.findById(params.id).select("-password");

    return NextResponse.json({
      user: updatedUser,
      isFollowing: currentUser.following.includes(params.id),
    });
  } catch (error) {
    console.error("Follow user error:", error);
    return NextResponse.json(
      { message: "Error following/unfollowing user" },
      { status: 500 },
    );
  }
}

// Update user profile
export async function PATCH(req, { params }) {
  try {
    await connectDB();

    const { userId, name, bio, location, profilePicture, coverPicture } =
      await req.json();

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
