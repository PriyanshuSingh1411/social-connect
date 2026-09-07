import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "./db";
import User from "../models/User";
import { checkRateLimit } from "./rateLimit";

// Deliberately generic: whether the account doesn't exist or the
// password is wrong, the caller sees the same message. Distinguishing
// the two lets an attacker enumerate which emails/usernames have
// accounts on the platform.
const GENERIC_LOGIN_ERROR = "Invalid username/email or password";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: {
          label: "Username or email",
          type: "text",
          placeholder: "Username or email",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier =
          typeof credentials?.identifier === "string"
            ? credentials.identifier.trim()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!identifier || !password || password.length > 72) {
          throw new Error(GENERIC_LOGIN_ERROR);
        }

        // Rate-limit per identifier so repeated guesses against one
        // account are throttled even if the attacker rotates IPs.
        const rl = checkRateLimit(
          `login:${identifier.toLowerCase()}`,
          10,
          10 * 60_000,
        );
        if (!rl.allowed) {
          throw new Error(
            "Too many login attempts. Please try again in a few minutes.",
          );
        }

        await connectDB();

        const isEmail = identifier.includes("@");
        const user = await User.findOne(
          isEmail
            ? { email: identifier.toLowerCase() }
            : { username: identifier },
        ).select("+password");

        // Always run bcrypt.compare, even with no user, using a fixed
        // dummy hash. This keeps the response time (and thus the
        // timing side-channel) the same whether or not the account
        // exists, rather than short-circuiting on `!user`.
        const DUMMY_HASH =
          "$2a$10$CwTycUXWue0Thq9StjUM0uJ8i8bqLR9CTMH5qXwZG.p6R7ZzKfKt2";
        const isPasswordValid = await bcrypt.compare(
          password,
          user?.password || DUMMY_HASH,
        );

        if (!user || !isPasswordValid) {
          throw new Error(GENERIC_LOGIN_ERROR);
        }

        // Return only minimal necessary data to reduce JWT token size
        return {
          id: user._id.toString(),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Only store minimal necessary data in token
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id;
        // Fetch user data to include profile picture in session
        try {
          await connectDB();
          const user = await User.findById(token.id).select(
            "name username profilePicture",
          );
          if (user) {
            session.user.name = user.name;
            session.user.username = user.username;
            session.user.profilePicture = user.profilePicture;
          }
        } catch (error) {
          console.error("Error fetching user data for session:", error);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

export default authOptions;
