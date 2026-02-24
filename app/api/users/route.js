import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import User from "../../../models/User";

// Get users for search
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    // Support both 'q' and 'search' query parameters
    const query = searchParams.get("q") || searchParams.get("search");

    if (!query) {
      return NextResponse.json({ users: [] });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
      ],
    })
      .select("name username profilePicture")
      .limit(10);

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Search users error:", error);
    return NextResponse.json(
      { message: "Error searching users" },
      { status: 500 },
    );
  }
}
