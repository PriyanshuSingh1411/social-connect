import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "./db";
import User from "../models/User";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "email@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectDB();

        const user = await User.findOne({ email: credentials.email }).select(
          "+password",
        );

        if (!user) {
          throw new Error("No user found with this email");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
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
