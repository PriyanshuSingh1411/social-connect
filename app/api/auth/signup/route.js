import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "../../../../lib/db";
import User from "../../../../models/User";

export async function POST(req) {
  try {
    await connectDB();

    const { name, username, email, password } = await req.json();

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists with this email or username" },
        { status: 400 },
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: { id: user._id, name, username, email },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
