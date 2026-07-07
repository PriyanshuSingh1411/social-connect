import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import User from "../../../../models/User";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 },
      );
    }

    const user = await User.findById(userId).populate(
      "blockedUsers",
      "name username profilePicture",
    );

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ blockedUsers: user.blockedUsers || [] });
  } catch (error) {
    console.error("Get blocked users error:", error);
    return NextResponse.json(
      { message: "Error fetching blocked users" },
      { status: 500 },
    );
  }
}

</parameter>
</create_file>
