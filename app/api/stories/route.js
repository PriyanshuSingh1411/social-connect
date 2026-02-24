import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import Story from "../../../models/Story";
import User from "../../../models/User";

// Get all stories (for stories bar)
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    let stories;

    if (userId) {
      // Get stories from users that the current user follows
      const user = await User.findById(userId);
      if (user && user.following.length > 0) {
        const followingIds = [...user.following, userId];
        stories = await Story.find({
          userId: { $in: followingIds },
          expiresAt: { $gt: new Date() },
        })
          .populate("userId", "name username profilePicture")
          .sort({ createdAt: -1 })
          .limit(50);
      } else {
        // If no following, get all recent stories
        stories = await Story.find({
          expiresAt: { $gt: new Date() },
        })
          .populate("userId", "name username profilePicture")
          .sort({ createdAt: -1 })
          .limit(50);
      }
    } else {
      // Get all active stories
      stories = await Story.find({
        expiresAt: { $gt: new Date() },
      })
        .populate("userId", "name username profilePicture")
        .sort({ createdAt: -1 })
        .limit(50);
    }

    // Group stories by user
    const storiesByUser = stories.reduce((acc, story) => {
      const userId = story.userId._id.toString();
      if (!acc[userId]) {
        acc[userId] = {
          user: story.userId,
          stories: [],
        };
      }
      acc[userId].stories.push(story);
      return acc;
    }, {});

    return NextResponse.json({
      stories: Object.values(storiesByUser),
    });
  } catch (error) {
    console.error("Get stories error:", error);
    return NextResponse.json(
      { message: "Error fetching stories" },
      { status: 500 },
    );
  }
}

// Create a new story
export async function POST(req) {
  try {
    await connectDB();

    const { userId, media, mediaType } = await req.json();

    if (!userId || !media) {
      return NextResponse.json(
        { message: "User ID and media are required" },
        { status: 400 },
      );
    }

    // Story expires in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = await Story.create({
      userId,
      media,
      mediaType: mediaType || "image",
      expiresAt,
    });

    const populatedStory = await Story.findById(story._id).populate(
      "userId",
      "name username profilePicture",
    );

    return NextResponse.json(
      { message: "Story created successfully", story: populatedStory },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create story error:", error);
    return NextResponse.json(
      { message: "Error creating story" },
      { status: 500 },
    );
  }
}
