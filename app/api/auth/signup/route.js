import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "../../../../lib/db";
import User from "../../../../models/User";
import { validateSignupInput } from "../../../../lib/validation";
import { checkRateLimit, getClientIp } from "../../../../lib/rateLimit";

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`signup:${ip}`, 5, 10 * 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { message: "Too many signup attempts. Please try again later." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const { name, username, email, password } = body;

    const { valid, errors } = validateSignupInput({
      name,
      username,
      email,
      password,
    });

    if (!valid) {
      return NextResponse.json(
        { message: "Please fix the errors below", errors },
        { status: 400 },
      );
    }

    await connectDB();

    // Normalize once, then only ever query with the normalized strings
    // (never the raw request fields) so a non-string payload can't
    // reach the query as an operator object.
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedUsername = String(username).trim();

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    }).select("_id email username");

    if (existingUser) {
      const field =
        existingUser.email === normalizedEmail ? "email" : "username";
      return NextResponse.json(
        {
          message:
            field === "email"
              ? "An account with this email already exists"
              : "This username is already taken",
          errors: { [field]: "Already in use" },
        },
        { status: 409 },
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(String(password), salt);

    const user = await User.create({
      name: String(name).trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error.code === 11000) {
      // Unique index race: two signups for the same email/username landed
      // concurrently and both passed the findOne check above.
      return NextResponse.json(
        { message: "An account with this email or username already exists" },
        { status: 409 },
      );
    }
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { message: "Please check your details and try again" },
        { status: 400 },
      );
    }
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
