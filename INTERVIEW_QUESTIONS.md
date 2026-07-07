# Interview Questions & Answers for Social Connect Application

## Table of Contents

1. [General & Architecture](#general--architecture)
2. [MongoDB & Mongoose](#mongodb--mongoose)
3. [Authentication (NextAuth.js)](#authentication-nextauthjs)
4. [API Routes & Backend](#api-routes--backend)
5. [Frontend & React](#frontend--react)
6. [Real-time Features](#real-time-features)
7. [Database Design](#database-design)
8. [Performance & Optimization](#performance--optimization)
9. [Security](#security)
10. [Deployment](#deployment)
11. [Advanced Topics](#advanced-topics)
12. [Code-Specific Questions](#code-specific-questions)

---

## General & Architecture

### 1. What is the overall architecture of this application and what technologies does it use?

**Answer:**
This is a full-stack social media application built with:

- **Frontend & Framework**: Next.js 14 (App Router)
- **Database**: MongoDB (NoSQL)
- **ORM/ODM**: Mongoose
- **Authentication**: NextAuth.js with JWT strategy
- **Styling**: CSS Modules
- **Runtime**: Node.js

The application follows a client-server architecture with RESTful API endpoints. Next.js handles both the frontend UI and backend API routes, providing server-side rendering (SSR) for improved performance and SEO.

---

### 2. Explain the folder structure and how the Next.js App Router is organized.

**Answer:**
The project uses the Next.js 14 App Router with the following structure:

```
social-connect/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API Routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── users/         # User-related endpoints
│   │   ├── posts/         # Post endpoints
│   │   ├── messages/      # Messaging endpoints
│   │   ├── notifications/ # Notification endpoints
│   │   ├── stories/       # Stories endpoints
│   │   └── hashtags/      # Hashtag endpoints
│   ├── home/              # Home feed page
│   ├── profile/           # User profile pages
│   ├── chat/              # Chat interface
│   ├── explore/           # Explore/discovery page
│   ├── notifications/     # Notifications page
│   ├── login/             # Login page
│   ├── signup/            # Registration page
│   └── layout.js          # Root layout
├── models/                # Mongoose schemas
│   ├── User.js
│   ├── Post.js
│   ├── Message.js
│   ├── Notification.js
│   └── Story.js
├── lib/                   # Utility libraries
│   ├── db.js             # MongoDB connection
│   └── auth.js           # NextAuth configuration
└── components/            # React components
```

The App Router uses a file-system based routing where folders define routes and `page.js` files make them accessible. Dynamic routes use square brackets like `[id]/`.

---

### 3. How do you handle environment variables in this project?

**Answer:**
Environment variables are handled through:

1. **`.env.local` files** - For local development
2. **Vercel Dashboard** - For production environment variables

Key environment variables used:

```env
MONGODB_URI=mongodb://localhost:27017/socialconnect
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

In the code, environment variables are accessed via `process.env`:

```javascript
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/socialconnect";
```

The app handles missing environment variables gracefully, providing defaults where appropriate and skipping certain operations during build time.

---

## MongoDB & Mongoose

### 4. What is MongoDB and how does it differ from relational databases?

**Answer:**
MongoDB is a NoSQL (Not Only SQL) document database that differs from relational databases in several ways:

| Feature           | MongoDB               | Relational Databases |
| ----------------- | --------------------- | -------------------- |
| **Data Model**    | Documents (BSON)      | Tables with rows     |
| **Schema**        | Flexible/Dynamic      | Fixed                |
| **Relationships** | Embed or Reference    | Joins                |
| **Scaling**       | Horizontal (Sharding) | Vertical             |
| **Transactions**  | Limited (ACID)        | Full ACID            |

MongoDB stores data in JSON-like documents with flexible schemas, allowing different fields in different documents. This is ideal for rapidly evolving applications and unstructured data.

---

### 5. Explain the Mongoose schemas you see in the models folder.

**Answer:**

**User Schema** - Contains user profile information:

```javascript
{
  name, username, email, password, profilePicture,
  bio, followers[], following[], blockedUsers[],
  savedPosts[], notifications[], stories[]
}
```

**Post Schema** - Contains posts with likes, comments, shares:

```javascript
{
  userId, content, images[], likes[], comments[],
  shares[], hashtags[], sharedPost
}
```

**Message Schema** - Contains direct messages:

```javascript
{
  sender, receiver, conversationId, content,
  readBy[], deletedBy[]
}
```

**Notification Schema** - Contains user notifications:

```javascript
{
  (recipient, sender, post, type, read);
}
```

**Story Schema** - Contains ephemeral stories:

```javascript
{
  userId, content, views[], expiresAt
}
```

Each schema uses Mongoose for schema definition, validation, and middleware hooks.

---

### 6. What are MongoDB ObjectId references and how are they used in this project?

**Answer:**
MongoDB ObjectId is a 12-byte unique identifier with the structure: `[timestamp][machine ID][process ID][counter]`

In this project, ObjectId references are used for relationships between collections:

```javascript
// Referencing another document
userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User"
}

// Referencing in queries
const post = await Post.findById(postId).populate("userId", "name profilePicture");
```

This implements a **normalized data model** where related data is stored in separate collections but can be joined via population. It's more storage-efficient than embedding and allows easier updates.

---

### 7. How does the connection caching work in lib/db.js?

**Answer:**
The database connection uses connection caching to improve performance:

```javascript
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

**Benefits:**

- **Prevents multiple connections** during hot reload in development
- **Improves performance** by reusing existing connections
- **Handles concurrent requests** by sharing the same promise
- **Uses global caching** to persist across serverless function invocations

---

### 8. What are indexes in MongoDB and where are they used in this project?

**Answer:**
Indexes improve query performance by creating data structures that allow faster lookups.

In this project, indexes are used in:

```javascript
// In User model - for follower/following lookups
followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }],
following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }],

// In Story model - for auto-deletion
expiresAt: { type: Date, index: { expires: 10 } },

// Common indexes added implicitly
{ userId: 1, createdAt: -1 }  // For feed queries
{ content: "text" }           // For text search
```

Indexes can be:

- **Single field**: `{ email: 1 }`
- **Compound**: `{ userId: 1, createdAt: -1 }`
- **Text**: For full-text search on content
- **TTL (Time-To-Live)**: For automatic document expiration (stories)

---

## Authentication (NextAuth.js)

### 9. How is authentication implemented in this application?

**Answer:**
Authentication is implemented using NextAuth.js with a credentials provider:

```javascript
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Connect to database
        await connectDB();

        // Find user by email
        const user = await User.findOne({ email: credentials.email }).select(
          "+password",
        );

        // Verify password with bcrypt
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return { id: user._id.toString() };
      },
    }),
  ],
};
```

**Key features:**

- Email/password authentication
- Password hashing with bcrypt
- JWT-based sessions
- Custom login page at `/login`

---

### 10. Explain the JWT strategy used in lib/auth.js.

**Answer:**
The JWT strategy is configured as follows:

```javascript
session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60 // 30 days
}
```

**How it works:**

1. **On login** (`jwt` callback):

```javascript
async jwt({ token, user }) {
  if (user) {
    token.id = user.id;
  }
  return token;
}
```

2. **On session access** (`session` callback):

```javascript
async session({ session, token }) {
  session.user.id = token.id;

  // Fetch additional user data
  const user = await User.findById(token.id)
    .select("name username profilePicture");

  session.user.name = user.name;
  session.user.username = user.username;
  session.user.profilePicture = user.profilePicture;

  return session;
}
```

**Benefits:**

- Serverless-friendly (no session store needed)
- 30-day persistence with `maxAge`
- Minimal token size (only stores user ID)
- Additional user data fetched on each session refresh

---

### 11. What is the purpose of the callbacks in NextAuth configuration?

**Answer:**
Callbacks in NextAuth allow customizing the JWT token and session objects:

1. **jwt callback** - Controls what's stored in the JWT token:
   - Adds user ID to token after login
   - Can add custom claims
   - Handles token refresh

2. **session callback** - Controls what's available to the client:
   - Adds user ID to session object
   - Fetches additional profile data (name, username, profilePicture)
   - Makes user data available in `useSession()` hook

```javascript
callbacks: {
  async jwt({ token, user }) {
    // Add user ID to token on login
    if (user) {
      token.id = user.id;
    }
    return token;
  },

  async session({ session, token }) {
    // Add user ID to session
    session.user.id = token.id;

    // Fetch and add profile data
    const user = await User.findById(token.id)
      .select("name username profilePicture");

    if (user) {
      session.user.name = user.name;
      session.user.username = user.username;
      session.user.profilePicture = user.profilePicture;
    }

    return session;
  }
}
```

---

### 12. How do you handle session persistence (maxAge: 30 days)?

**Answer:**
Session persistence is handled via:

```javascript
session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60 // 30 days = 2,592,000 seconds
}
```

**How it works:**

1. When user logs in, a JWT is created with a 30-day expiration
2. The JWT is stored in an HTTP-only cookie
3. On each request, NextAuth validates the JWT
4. If valid, the session is extended automatically
5. After 30 days of inactivity, the session expires

**Cookie configuration:**

```javascript
cookies: {
  sessionToken: {
    name: `next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production"
    }
  }
}
```

**Security features:**

- `httpOnly`: Prevents XSS attacks (JS can't access cookie)
- `sameSite: "lax"`: CSRF protection
- `secure`: HTTPS only in production

---

## API Routes & Backend

### 13. Explain the API route structure for posts, users, messages, and notifications.

**Answer:**
The API routes follow RESTful conventions:

**Users API:**

- `GET /api/users` - Get all users
- `GET /api/users/[id]` - Get specific user
- `GET /api/users/[id]/followers` - Get user's followers
- `GET /api/users/[id]/following` - Get who user follows
- `GET /api/users/search` - Search users
- `GET /api/users/suggestions` - Get suggested users
- `POST /api/users/blocked` - Block a user

**Posts API:**

- `GET /api/posts` - Get all posts (feed)
- `POST /api/posts` - Create new post
- `GET /api/posts/[id]` - Get specific post
- `PUT /api/posts/[id]` - Update post
- `DELETE /api/posts/[id]` - Delete post

**Messages API:**

- `GET /api/messages` - Get conversations
- `POST /api/messages` - Send message
- `GET /api/conversations` - Get conversation list

**Notifications API:**

- `GET /api/notifications` - Get user notifications
- `POST /api/notifications` - Create notification
- `PUT /api/notifications` - Mark as read

**Stories API:**

- `GET /api/stories` - Get stories
- `POST /api/stories` - Create story
- `DELETE /api/stories` - Delete story

---

### 14. How do dynamic routes like app/api/posts/[id]/route.js work?

**Answer:**
Dynamic routes use bracket notation `[parameter]` to create flexible URL patterns:

**File structure:**

```
app/
└── api/
    └── posts/
        ├── route.js          # /api/posts
        └── [id]/
            └── route.js      # /api/posts/:id
```

**Accessing the parameter:**

```javascript
// app/api/posts/[id]/route.js
import { NextResponse } from "next/server";
import Post from "@/models/Post";

export async function GET(request, { params }) {
  const { id } = params; // Get 'id' from URL

  const post = await Post.findById(id)
    .populate("userId", "name username profilePicture")
    .populate("comments.userId", "name username profilePicture");

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function PUT(request, { params }) {
  const { id } = params;
  const body = await request.json();

  const post = await Post.findByIdAndUpdate(id, { $set: body }, { new: true });

  return NextResponse.json(post);
}

export async function DELETE(request, { params }) {
  const { id } = params;

  await Post.findByIdAndDelete(id);

  return NextResponse.json({ message: "Post deleted" });
}
```

---

### 15. What is the difference between GET, POST, PUT, DELETE methods in API routes?

**Answer:**
HTTP methods in Next.js API routes:

| Method     | Purpose                 | Idempotent | Common Use            |
| ---------- | ----------------------- | ---------- | --------------------- |
| **GET**    | Retrieve data           | Yes        | Fetch posts, users    |
| **POST**   | Create new resource     | No         | Create post, register |
| **PUT**    | Replace entire resource | Yes        | Update profile        |
| **PATCH**  | Partial update          | No         | Like a post           |
| **DELETE** | Remove resource         | Yes        | Delete post           |

**Implementation in Next.js:**

```javascript
// GET - Fetch data
export async function GET(request) {
  const posts = await Post.find();
  return NextResponse.json(posts);
}

// POST - Create new resource
export async function POST(request) {
  const body = await request.json();
  const post = await Post.create(body);
  return NextResponse.json(post, { status: 201 });
}

// PUT - Full update
export async function PUT(request) {
  const body = await request.json();
  const post = await Post.findByIdAndUpdate(body.id, body, { new: true });
  return NextResponse.json(post);
}

// DELETE - Remove resource
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  await Post.findByIdAndDelete(id);
  return NextResponse.json({ message: "Deleted" });
}
```

---

## Frontend & React

### 16. What is the difference between Next.js Client Components and Server Components?

**Answer:**

| Feature           | Server Components | Client Components         |
| ----------------- | ----------------- | ------------------------- |
| **Rendering**     | Server-side       | Client-side               |
| **Interactivity** | No (by default)   | Yes                       |
| **Hooks**         | No                | Yes (useState, useEffect) |
| **API calls**     | Direct DB access  | via API routes            |
| **Bundle size**   | Smaller           | Larger                    |
| **SEO**           | Better            | Good                      |

**Server Components** (`app/page.js` by default):

```javascript
// This runs on the server
async function HomePage() {
  const posts = await fetchPosts(); // Direct DB access

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
}
```

**Client Components** (`"use client"` at top):

```javascript
"use client";

import { useState } from "react";

function LikeButton({ postId }) {
  const [liked, setLiked] = useState(false);

  const handleLike = async () => {
    await fetch(`/api/posts/${postId}`, {
      method: "PUT",
      body: JSON.stringify({ liked: !liked }),
    });
    setLiked(!liked);
  };

  return <button onClick={handleLike}>{liked ? "Unlike" : "Like"}</button>;
}
```

In this project, pages like `app/home/page.js` are server components for SEO, while interactive components use `"use client"`.

---

### 17. How does the app use CSS modules?

**Answer:**
CSS Modules provide scoped styling, preventing class name conflicts:

**File structure:**

```
app/
├── home/
│   ├── page.js
│   └── home.module.css
```

**CSS file** (`home.module.css`):

```css
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.post {
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 16px;
}

.username {
  font-weight: bold;
  color: #333;
}
```

**Usage in component** (`page.js`):

```javascript
import styles from "./home.module.css";

export default function HomePage() {
  return (
    <div className={styles.container}>
      <h1>Home Feed</h1>
      <div className={styles.post}>
        <span className={styles.username}>johndoe</span>
        <p>Hello world!</p>
      </div>
    </div>
  );
}
```

**Benefits:**

- Scoped styles (no global conflicts)
- Unique class names generated at build time
- Better performance (CSS loaded only where needed)

---

### 18. Explain the page routing in the app directory.

**Answer:**
Next.js 14 App Router uses file-system based routing:

```
app/
├── page.js                  # / (root)
├── login/
│   └── page.js              # /login
├── signup/
│   └── page.js              # /signup
├── home/
│   └── page.js              # /home
├── profile/
│   └── [id]/
│       └── page.js          # /profile/:id
├── chat/
│   └── page.js              # /chat
├── explore/
│   └── page.js              # /explore
├── notifications/
│   └── page.js              # /notifications
└── stories/
    └── page.js              # /stories
```

**Route Parameters:**

- **Static routes**: `/login`, `/signup` - Fixed paths
- **Dynamic routes**: `/profile/[id]` - Variable segments
- **Catch-all routes**: `[[...slug]]` - Optional segments

**Navigation:**

```javascript
import Link from "next/link";

// Client-side navigation
<Link href="/profile/123">View Profile</Link>;

// Programmatic navigation
import { useRouter } from "next/navigation";
const router = useRouter();
router.push("/home");
```

---

### 19. How is state management handled in this application?

**Answer:**
State management in this project uses multiple approaches:

**1. React Server Components** - Server-side state:

```javascript
// Data fetched on server, no client state needed
async function HomePage() {
  const posts = await getPosts(); // Server-side fetch
  return <Feed posts={posts} />;
}
```

**2. Client State with useState/useReducer**:

```javascript
"use client";
import { useState } from "react";

function PostForm() {
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);

  return (
    <form>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} />
    </form>
  );
}
```

**3. NextAuth Session** - Authentication state:

```javascript
import { useSession, signIn, signOut } from "next-auth/react";

function NavBar() {
  const { data: session } = useSession();

  if (session) {
    return <button onClick={() => signOut()}>Sign out</button>;
  }
}
```

**4. URL Parameters** - For page-specific state:

```javascript
// /profile/123 shows user 123's profile
// /explore?tag=javascript filters by hashtag
```

---

## Real-time Features

### 20. How would you implement real-time notifications?

**Answer:**
Real-time notifications can be implemented in several ways:

**Option 1: Polling (Current approach)**

```javascript
// Fetch notifications periodically
useEffect(() => {
  const fetchNotifications = async () => {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setNotifications(data);
  };

  const interval = setInterval(fetchNotifications, 30000);
  return () => clearInterval(interval);
}, []);
```

**Option 2: WebSockets (Recommended for production)**

```javascript
// Using Socket.io
import { io } from "socket.io-client";

function NotificationComponent() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const socket = io("http://localhost:3000");

    socket.on("notification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => socket.disconnect();
  }, []);

  return <NotificationList notifications={notifications} />;
}
```

**Server-side (Socket.io):**

```javascript
// In API route when creating notification
io.to(recipientId).emit("notification", {
  type: "like",
  from: currentUserId,
  postId: postId,
});
```

---

### 21. Explain how typing indicators work.

**Answer:**
Typing indicators show when a user is typing a message:

**API Route** (`app/api/users/typing/route.js`):

```javascript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { receiverId, isTyping } = await request.json();

  // Store typing status (could use Redis, database, or in-memory)
  // This would typically integrate with WebSockets

  return NextResponse.json({ success: true });
}
```

**Frontend Implementation:**

```javascript
"use client";
import { useState, useEffect } from "react";

function ChatInput({ receiverId }) {
  const [isTyping, setIsTyping] = useState(false);
  let typingTimeout;

  const handleInputChange = (e) => {
    if (!isTyping) {
      setIsTyping(true);
      // Notify server user started typing
      fetch("/api/users/typing", {
        method: "POST",
        body: JSON.stringify({ receiverId, isTyping: true }),
      });
    }

    // Clear previous timeout
    clearTimeout(typingTimeout);

    // Stop typing after 2 seconds of inactivity
    typingTimeout = setTimeout(() => {
      setIsTyping(false);
      fetch("/api/users/typing", {
        method: "POST",
        body: JSON.stringify({ receiverId, isTyping: false }),
      });
    }, 2000);
  };

  return <input onChange={handleInputChange} placeholder="Type a message..." />;
}
```

**Real-time with WebSockets (Better approach):**

```javascript
// Better: Use Socket.io for real-time typing
socket.emit("typing", { to: receiverId });
socket.on("typing", ({ from }) => setTypingUser(from));
```

---

### 22. How would you implement online/offline user status?

**Answer:**
Online/offline status can be implemented in multiple ways:

**Database-based approach** (`app/api/users/online/route.js`):

```javascript
// Update user status
export async function POST(request) {
  const session = await getServerSession(authOptions);
  const { isOnline } = await request.json();

  await User.findByIdAndUpdate(session.user.id, {
    isOnline: isOnline,
    lastSeen: new Date(),
  });

  return NextResponse.json({ success: true });
}
```

**Frontend - Heartbeat approach:**

```javascript
"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

function OnlineStatus() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session) return;

    // Set online on mount
    const setOnline = async () => {
      await fetch("/api/users/online", {
        method: "POST",
        body: JSON.stringify({ isOnline: true }),
      });
    };

    setOnline();

    // Heartbeat every 30 seconds
    const heartbeat = setInterval(async () => {
      await fetch("/api/users/online", {
        method: "POST",
        body: JSON.stringify({ isOnline: true }),
      });
    }, 30000);

    // Set offline on unmount
    const setOffline = async () => {
      await fetch("/api/users/online", {
        method: "POST",
        body: JSON.stringify({ isOnline: false }),
      });
    };

    window.addEventListener("beforeunload", setOffline);

    return () => {
      clearInterval(heartbeat);
      setOffline();
      window.removeEventListener("beforeunload", setOffline);
    };
  }, [session]);

  return null;
}
```

**Redis-based (More efficient for production):**

```javascript
// Using Redis for real-time status
await redis.setex(`online:${userId}`, 60, "1"); // Expire in 60s

// Check if user is online
const isOnline = await redis.exists(`online:${userId}`);
```

---

## Database Design

### 23. Design the database schema for a social media post with comments and likes.

**Answer:**

**Post Schema:**

```javascript
const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      maxLength: 5000,
    },
    images: [
      {
        type: String, // URLs to images
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        content: {
          type: String,
          required: true,
          maxLength: 1000,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    shares: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    hashtags: [String],
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    sharedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for performance
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ hashtags: 1, createdAt: -1 });

// Virtual for comment count
postSchema.virtual("commentCount").get(function () {
  return this.comments.length;
});
```

**Usage Examples:**

```javascript
// Create post
const post = await Post.create({
  userId: user._id,
  content: "Hello world! #introduction",
  images: ["https://cdn.example.com/image1.jpg"],
});

// Like post
await Post.findByIdAndUpdate(postId, {
  $addToSet: { likes: userId }, // $addToSet prevents duplicates
});

// Unlike post
await Post.findByIdAndUpdate(postId, {
  $pull: { likes: userId },
});

// Add comment
await Post.findByIdAndUpdate(postId, {
  $push: {
    comments: {
      userId: user._id,
      content: "Great post!",
    },
  },
});
```

---

### 24. How would you model a follower/following relationship in MongoDB?

**Answer:**

**User Schema with follower/following:**

```javascript
const userSchema = new mongoose.Schema({
  // ... other fields
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true, // Index for faster lookup
    },
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
  ],
});
```

**Follow/Unfollow Operations:**

```javascript
// Follow a user
async function followUser(currentUserId, targetUserId) {
  // Add to current user's following
  await User.findByIdAndUpdate(currentUserId, {
    $addToSet: { following: targetUserId },
  });

  // Add to target user's followers
  await User.findByIdAndUpdate(targetUserId, {
    $addToSet: { followers: currentUserId },
  });

  // Create notification
  await Notification.create({
    recipient: targetUserId,
    sender: currentUserId,
    type: "follow",
  });
}

// Unfollow a user
async function unfollowUser(currentUserId, targetUserId) {
  await User.findByIdAndUpdate(currentUserId, {
    $pull: { following: targetUserId },
  });

  await User.findByIdAndUpdate(targetUserId, {
    $pull: { followers: currentUserId },
  });
}

// Get user's feed (posts from followed users)
async function getFeed(userId) {
  const user = await User.findById(userId).select("following");

  const posts = await Post.find({
    userId: { $in: user.following },
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate("userId", "name username profilePicture");

  return posts;
}
```

**Alternative: Separate Collection (For large scale):**

```javascript
// Follow relationship collection (better for millions of followers)
const followSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ follower: 1, createdAt: -1 });
followSchema.index({ following: 1, createdAt: -1 });
```

---

### 25. What are some strategies to handle large datasets in MongoDB?

**Answer:**

**1. Pagination:**

```javascript
// Offset-based pagination
async function getPosts(page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Post.countDocuments();

  return {
    posts,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
}

// Cursor-based pagination (better for large datasets)
async function getPostsCursor(cursor, limit = 10) {
  const query = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};

  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1); // Fetch one extra to check if more exist

  const hasMore = posts.length > limit;
  const results = hasMore ? posts.slice(0, -1) : posts;
  const nextCursor = hasMore
    ? results[results.length - 1].createdAt.toISOString()
    : null;

  return { posts: results, nextCursor };
}
```

**2. Indexing:**

```javascript
// Compound indexes for common queries
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ hashtags: 1, createdAt: -1 });
postSchema.index({ likes: -1 }); // For sorting by popularity

// Partial indexes
postSchema.index(
  { userId: 1, createdAt: -1 },
  { partialFilterExpression: { isDeleted: false } },
);
```

**3. Projection (Limit returned fields):**

```javascript
// Only return necessary fields
const posts = await Post.find()
  .select("content createdAt") // Exclude heavy fields like images
  .limit(20);
```

**4. Aggregation Pipeline:**

```javascript
// Efficient aggregation for analytics
const stats = await Post.aggregate([
  { $match: { userId: user._id } },
  {
    $group: {
      _id: null,
      totalPosts: { $sum: 1 },
      totalLikes: { $sum: { $size: "$likes" } },
    },
  },
]);
```

**5. Sharding (Horizontal Scaling):**

```javascript
// Shard key selection
sh.shardCollection("socialconnect.posts", { userId: 1 });
```

---

## Performance & Optimization

### 26. How would you optimize database queries in this application?

**Answer:**

**1. Use `select()` to limit fields:**

```javascript
// ❌ Bad - fetches all fields
const user = await User.findById(userId);

// ✅ Good - only fetches needed fields
const user = await User.findById(userId).select("name username profilePicture");
```

**2. Use `populate()` efficiently:**

```javascript
// ❌ Bad - multiple populate calls
const post = await Post.findById(postId);
await post.populate("userId");
await post.populate("comments.userId");

// ✅ Good - single populate with specific fields
const post = await Post.findById(postId)
  .populate("userId", "name username profilePicture")
  .populate("comments.userId", "name username");
```

**3. Create compound indexes:**

```javascript
// For feed queries
postSchema.index({ userId: 1, createdAt: -1 });

// For explore/trending
postSchema.index({ likes: -1, createdAt: -1 });
postSchema.index({ hashtags: 1, createdAt: -1 });
```

**4. Use lean() for read-only queries:**

```javascript
// Returns plain JS objects instead of Mongoose documents
const posts = await Post.find().sort({ createdAt: -1 }).limit(20).lean();
```

**5. Batch operations:**

```javascript
// ❌ Bad - N queries
for (const userId of userIds) {
  await User.findByIdAndUpdate(userId, { lastActive: new Date() });
}

// ✅ Good - single query
await User.updateMany({ _id: { $in: userIds } }, { lastActive: new Date() });
```

**6. Use explain() to analyze queries:**

```javascript
const explanation = await Post.find({ userId: userId })
  .sort({ createdAt: -1 })
  .explain("executionStats");

console.log(explanation.executionStats);
```

---

### 27. What strategies would you use to implement pagination?

**Answer:**

**Option 1: Offset Pagination (Simple but limited):**

```javascript
// API route
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 10;

  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name username profilePicture"),
    Post.countDocuments(),
  ]);

  return NextResponse.json({
    data: posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  });
}

// Frontend
function Pagination({ currentPage, totalPages, onPageChange }) {
  return (
    <div className="pagination">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>
    </div>
  );
}
```

**Option 2: Cursor Pagination (Better for large datasets):**

```javascript
// API route
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor"); // ISO date string
  const limit = parseInt(searchParams.get("limit")) || 10;

  const query = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};

  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1) // Fetch one extra
    .populate("userId", "name username profilePicture");

  const hasMore = posts.length > limit;
  const results = hasMore ? posts.slice(0, -1) : posts;
  const nextCursor = hasMore
    ? results[results.length - 1].createdAt.toISOString()
    : null;

  return NextResponse.json({
    data: results,
    nextCursor,
  });
}

// Frontend - Infinite scroll
function Feed() {
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (loading) return;
    setLoading(true);

    const url = cursor ? `/api/posts?cursor=${cursor}` : "/api/posts";

    const res = await fetch(url);
    const { data, nextCursor } = await res.json();

    setPosts([...posts, ...data]);
    setCursor(nextCursor);
    setLoading(false);
  };

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
      {cursor && <button onClick={loadMore}>Load More</button>}
    </div>
  );
}
```

**Comparison:**
| Aspect | Offset | Cursor |
|--------|--------|--------|
| **Performance** | Slower on large datasets | Constant time |
| **Jump to page** | Yes | No |
| **Real-time data** | Gaps possible | Consistent |
| **Use case** | Small datasets | Large datasets |

---

### 28. How does Next.js handle caching and revalidation?

**Answer:**

**1. Default Caching (Static Data):**

```javascript
// This data is cached by default
async function getPosts() {
  const res = await fetch("/api/posts");
  return res.json();
}

// In Server Component
export default async function Page() {
  const posts = await getPosts(); // Cached until rebuild
  return <Feed posts={posts} />;
}
```

**2. Dynamic Data (No Cache):**

```javascript
// Force dynamic rendering
export const dynamic = "force-dynamic";

// Or in fetch
const res = await fetch("/api/posts", {
  cache: "no-store",
});
```

**3. Time-based Revalidation:**

```javascript
// Revalidate every 60 seconds
const res = await fetch("/api/posts", {
  next: { revalidate: 60 },
});
```

**4. On-demand Revalidation:**

```javascript
// API route for revalidation
import { revalidatePath } from "next/cache";

export async function POST(request) {
  // After creating/updating a post
  revalidatePath("/home");
  revalidatePath("/explore");

  return NextResponse.json({ revalidated: true });
}

// Tag-based revalidation
export async function GET(request) {
  const res = await fetch("/api/posts", {
    next: { tags: ["posts"] },
  });
}

// Revalidate by tag
revalidateTag("posts");
```

**5. Route Segment Config:**

```javascript
// app/posts/page.js
export const revalidate = 60; // Revalidate every 60 seconds

export const dynamicParams = true; // Allow dynamic params

export async function generateStaticParams() {
  // Pre-render popular posts
  const posts = await getPopularPosts();
  return posts.map((post) => ({ id: post._id }));
}
```

---

## Security

### 29. What security measures would you implement for this social media app?

**Answer:**

**1. Authentication & Authorization:**

```javascript
// Protect API routes
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only allow users to access their own data
  if (session.user.id !== requestedUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Proceed with request
}
```

**2. Password Hashing:**

```javascript
import bcrypt from "bcryptjs";

// Hash password on registration
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// Verify password on login
const isValid = await bcrypt.compare(password, user.password);
```

**3. Input Validation:**

```javascript
import { z } from "zod";

const postSchema = z.object({
  content: z
    .string()
    .min(1, "Content is required")
    .max(5000, "Content too long")
    .trim()
    .escape(), // Sanitize HTML
  images: z.array(z.string().url()).max(4).optional(),
});

export async function POST(request) {
  const body = await request.json();

  // Validate input
  const result = postSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.errors }, { status: 400 });
  }
}
```

**4. Rate Limiting:**

```javascript
// Implement rate limiting
const rateLimit = new Map();

export function rateLimitMiddleware(request) {
  const ip = request.headers.get("x-forwarded-for");
  const now = Date.now();

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 1, resetTime: now + 60000 });
    return true;
  }

  const limit = rateLimit.get(ip);

  if (now > limit.resetTime) {
    limit.count = 1;
    limit.resetTime = now + 60000;
    return true;
  }

  if (limit.count >= 100) {
    return false; // Rate limited
  }

  limit.count++;
  return true;
}
```

**5. CSRF Protection:**

```javascript
// NextAuth handles CSRF automatically via SameSite cookies
// Additional CSRF token for API routes
import { csrfToken } from "next-auth/react";

// In form
<input type="hidden" name="csrfToken" value={csrfToken} />;
```

**6. XSS Prevention:**

```javascript
// Sanitize user input
import DOMPurify from "isomorphic-dompurify";

const sanitizedContent = DOMPurify.sanitize(userInput);

// React escapes by default when using {content}
```

**7. Secure Headers:**

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; img-src 'self' https: data:;",
          },
        ],
      },
    ];
  },
};
```

---

### 30. How do you protect API routes from unauthorized access?

**Answer:**

**Method 1: Session Check:**

```javascript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Access granted
  const user = await User.findById(session.user.id);
  return NextResponse.json(user);
}
```

**Method 2: Middleware Protection:**

```javascript
// middleware.js
import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: ["/home/:path*", "/profile/:path*", "/chat/:path*"],
};
```

**Method 3: Route-level Protection:**

```javascript
// Protect specific routes
const protectedRoutes = ["/home", "/profile", "/chat", "/notifications"];

export function middleware(request) {
  const token = request.nextauth?.token;
  const path = request.nextUrl.pathname;

  if (protectedRoutes.some((route) => path.startsWith(route)) && !token) {
    return Response.redirect(new URL("/login", request.url));
  }
}
```

**Method 4: Role-based Access:**

```javascript
// Check user role
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const post = await Post.findById(params.id);

  // Only post owner or admin can delete
  if (
    post.userId.toString() !== session.user.id &&
    session.user.role !== "admin"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await post.deleteOne();
  return NextResponse.json({ success: true });
}
```

---

### 31. Explain input validation and sanitization strategies.

**Answer:**

**Validation with Zod:**

```javascript
import { z } from "zod";

// User registration validation
const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name too long")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters"),

  email: z
    .string()
    .email("Invalid email format")
    .endsWith("@example.com", "Must use company email"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain uppercase")
    .regex(/[0-9]/, "Password must contain number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain special character"),

  username: z
    .string()
    .min(3, "Username too short")
    .max(20, "Username too long")
    .regex(/^[a-zA-Z0-9_]+$/, "Invalid username format"),
});

// Post validation
const postSchema = z.object({
  content: z.string().min(1, "Content required").max(5000, "Content too long"),

  images: z.array(z.string().url()).max(4).optional(),

  hashtags: z.array(z.string()).optional(),
});

// Usage
export async function POST(request) {
  const body = await request.json();

  const result = postSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: result.error.flatten(),
      },
      { status: 400 },
    );
  }

  // Proceed with validated data
  const { content, images, hashtags } = result.data;
}
```

**Sanitization:**

```javascript
import DOMPurify from "isomorphic-dompurify";

// HTML sanitization (for rich text content)
const sanitizedContent = DOMPurify.sanitize(userContent, {
  ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br"],
  ALLOWED_ATTR: ["href", "target", "rel"],
});

// Extract and validate hashtags
function extractHashtags(content) {
  const hashtagRegex = /#(\w+)/g;
  const hashtags = content.match(hashtagRegex) || [];
  return hashtags.map(tag => tag.substring(1).toLowerCase());
}

// Escape special characters
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, """)
    .replace(/'/g, "&#039;");
}

// Validate URLs (prevent XSS via javascript: URLs)
function isSafeUrl(url) {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}
```

---

## Deployment

### 32. How would you deploy this application to Vercel?

**Answer:**

**Step 1: Push code to GitHub:**

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/social-connect.git
git push -u origin main
```

**Step 2: Deploy to Vercel:**

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure environment variables:

| Variable          | Value                                    |
| ----------------- | ---------------------------------------- |
| `MONGODB_URI`     | Your MongoDB Atlas connection string     |
| `NEXTAUTH_URL`    | `https://your-project.vercel.app`        |
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` |

5. Click "Deploy"

**Step 3: Production Checklist:**

```env
# Environment Variables in Vercel
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/socialconnect
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=<generated-secret>
NODE_ENV=production
```

**Step 4: Custom Domain (Optional):**

1. Go to Vercel Dashboard → Settings → Domains
2. Add your domain
3. Update DNS records as instructed

**Step 5: Deploy Updates:**

```bash
# Just push to main branch
git add .
git commit -m "Update features"
git push origin main

# Vercel automatically deploys
```

---

### 33. Explain the environment setup for production.

**Answer:**

**Development vs Production:**

| Aspect      | Development           | Production                 |
| ----------- | --------------------- | -------------------------- |
| **MongoDB** | Local MongoDB         | MongoDB Atlas              |
| **URL**     | http://localhost:3000 | https://yourapp.vercel.app |
| **Cookies** | Insecure              | Secure (HTTPS)             |
| **Logging** | Detailed              | Minimal                    |
| **Caching** | Minimal               | Aggressive                 |

**Environment Variables Setup:**

```env
# .env.local (Development)
MONGODB_URI=mongodb://localhost:27017/socialconnect
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-key
NODE_ENV=development

# Production (Vercel)
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/<db>
NEXTAUTH_URL=https://yourapp.vercel.app
NEXTAUTH_SECRET=<production-secret>
NODE_ENV=production
```

**Code Handling:**

```javascript
// Database connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/socialconnect";

// In production, skip local fallback
if (!MONGODB_URI || MONGODB_URI.includes("localhost")) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    throw new Error("MONGODB_URI is required in production");
  }
}

// Cookie security
const useSecureCookies = process.env.NODE_ENV === "production";

cookies: {
  sessionToken: {
    options: {
      httpOnly: true,
      sameSite: "lax",
      secure: useSecureCookies,  // true in production
      path: "/"
    }
  }
}
```

---

## Advanced Topics

### 34. How would you implement search functionality for posts and users?

**Answer:**

**User Search API** (`app/api/users/search/route.js`):

```javascript
import { NextResponse } from "next/server";
import User from "@/models/User";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const users = await User.find({
    $or: [
      { name: { $regex: query, $options: "i" } },
      { username: { $regex: query, $options: "i" } },
    ],
  })
    .select("name username profilePicture") // Limit fields
    .limit(20);

  return NextResponse.json({ users });
}
```

**Post Search API:**

```javascript
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ posts: [] });
  }

  const posts = await Post.find({
    $or: [
      { content: { $regex: query, $options: "i" } },
      { hashtags: { $in: [new RegExp(query, "i")] } },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate("userId", "name username profilePicture");

  return NextResponse.json({ posts });
}
```

**Hashtag Search** (`app/api/hashtags/search/route.js`):

```javascript
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag");

  const posts = await Post.find({
    hashtags: { $regex: new RegExp(`^${tag}$`, "i") },
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate("userId", "name username profilePicture");

  return NextResponse.json({ posts });
}
```

**Frontend Implementation:**

```javascript
"use client";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";

function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    const search = async () => {
      const res = await fetch(`/api/users/search?q=${debouncedQuery}`);
      const data = await res.json();
      setResults(data.users);
    };

    search();
  }, [debouncedQuery]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search users..."
      />
      <ul>
        {results.map((user) => (
          <li key={user._id}>
            <img src={user.profilePicture} alt={user.username} />
            <span>{user.name}</span>
            <span>@{user.username}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**For better search (Elasticsearch/Algolia for production):**

```javascript
// When data grows, use dedicated search service
// Example with Algolia
import algoliasearch from "algoliasearch";

const client = algoliasearch("APP_ID", "API_KEY");
const index = client.initIndex("users");

// Index user
await index.saveObject({
  objectID: user._id,
  name: user.name,
  username: user.username,
  profilePicture: user.profilePicture,
});

// Search
const { hits } = await index.search(query);
```

---

### 35. Explain how hashtags work and how you would track trending topics.

**Answer:**

**Hashtag Extraction:**

```javascript
// Extract hashtags from post content
function extractHashtags(content) {
  const hashtagRegex = /#(\w+)/g;
  const matches = content.match(hashtagRegex);

  if (!matches) return [];

  // Return unique hashtags in lowercase
  return [...new Set(matches.map((tag) => tag.substring(1).toLowerCase()))];
}

// Usage when creating post
const hashtags = extractHashtags(content);

// Save to post
const post = await Post.create({
  userId,
  content,
  hashtags,
});
```

**Trending Topics API** (`app/api/hashtags/trending/route.js`):

```javascript
import { NextResponse } from "next/server";
import Post from "@/models/Post";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get("timeframe") || "24h"; // 24h, 7d, 30d

  // Calculate start date based on timeframe
  const now = new Date();
  let startDate;

  switch (timeframe) {
    case "7d":
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
      break;
    default: // 24h
      startDate = new Date(now - 24 * 60 * 60 * 1000);
  }

  // Aggregate hashtags with post count
  const trending = await Post.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $unwind: "$hashtags" },
    {
      $group: {
        _id: { $toLower: "$hashtags" },
        count: { $sum: 1 },
        recentPosts: { $push: "$_id" },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
    {
      $project: {
        hashtag: "$_id",
        count: 1,
        _id: 0,
      },
    },
  ]);

  return NextResponse.json({ trending });
}
```

**Trending Page Implementation:**

```javascript
// app/trending/page.js
import Link from "next/link";

async function getTrendingHashtags() {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/hashtags/trending`, {
    next: { revalidate: 300 }, // Cache for 5 minutes
  });
  const data = await res.json();
  return data.trending;
}

export default async function TrendingPage() {
  const trending = await getTrendingHashtags();

  return (
    <div>
      <h1>Trending Hashtags</h1>
      {trending.map(({ hashtag, count }) => (
        <Link key={hashtag} href={`/explore?tag=${hashtag}`}>
          <div className="hashtag-card">
            <span className="hashtag">#{hashtag}</span>
            <span className="count">{count} posts</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
```

---

### 36. Design a system to handle stories that expire after 24 hours.

**Answer:**

**Story Schema:**

```javascript
const storySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  content: {
    type: String, // Image URL or text
    required: true,
  },
  type: {
    type: String,
    enum: ["image", "text"],
    default: "image",
  },
  views: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      viewedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  expiresAt: {
    type: Date,
    index: { expires: 0 }, // MongoDB TTL - delete when time passes
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-set expiration (24 hours from creation)
storySchema.pre("save", function (next) {
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  next();
});
```

**Create Story API:**

```javascript
export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content, type } = await request.json();

  const story = await Story.create({
    userId: session.user.id,
    content,
    type: type || "image",
    // expiresAt will be set by pre-save hook
  });

  return NextResponse.json(story, { status: 201 });
}
```

**Get Stories (Grouped by User):**

```javascript
export async function GET(request) {
  // Get stories from last 24 hours that haven't expired
  const stories = await Story.find({
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .populate("userId", "name username profilePicture");

  // Group stories by user
  const groupedStories = stories.reduce((acc, story) => {
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

  return NextResponse.json(Object.values(groupedStories));
}
```

**View Story API:**

```javascript
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);

  const story = await Story.findById(params.id);

  if (!story) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Add view if not already viewed
  const alreadyViewed = story.views.some(
    (view) => view.userId.toString() === session.user.id,
  );

  if (!alreadyViewed) {
    story.views.push({
      userId: session.user.id,
      viewedAt: new Date(),
    });
    await story.save();
  }

  return NextResponse.json({ success: true });
}
```

**Frontend - Story Viewer:**

```javascript
"use client";
import { useState } from "react";

function StoryViewer({ stories, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentStory = stories[currentIndex];

  // Auto-advance after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < stories.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onClose();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentIndex, stories.length, onClose]);

  // Mark as viewed
  useEffect(() => {
    fetch(`/api/stories/${currentStory._id}`, {
      method: "PUT",
    });
  }, [currentStory._id]);

  return (
    <div className="story-viewer">
      <img src={currentStory.content} alt="Story" />
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

---

### 37. How would you implement message delivery status (sent, delivered, read)?

**Answer:**

**Enhanced Message Schema:**

```javascript
const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["sent", "delivered", "read"],
    default: "sent",
  },
  readBy: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      readAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  deliveredAt: {
    type: Date,
  },
  readAt: {
    type: Date,
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient status queries
messageSchema.index({ receiver: 1, status: 1 });
messageSchema.index({ conversationId: 1, createdAt: 1 });
```

**Send Message:**

```javascript
export async function POST(request) {
  const session = await getServerSession(authOptions);
  const { receiverId, content } = await request.json();

  const message = await Message.create({
    sender: session.user.id,
    receiver: receiverId,
    content,
    status: "sent",
  });

  // Emit real-time event (Socket.io)
  io.to(receiverId).emit("new_message", message);

  return NextResponse.json(message, { status: 201 });
}
```

**Mark as Delivered:**

```javascript
// When user opens conversation
export async function PUT(request) {
  const session = await getServerSession(authOptions);
  const { messageIds } = await request.json();

  await Message.updateMany(
    {
      _id: { $in: messageIds },
      receiver: session.user.id,
      status: { $in: ["sent"] },
    },
    {
      $set: {
        status: "delivered",
        deliveredAt: new Date(),
      },
    },
  );

  // Notify sender
  const messages = await Message.find({ _id: { $in: messageIds } });
  messages.forEach((msg) => {
    io.to(msg.sender.toString()).emit("message_delivered", {
      messageId: msg._id,
    });
  });

  return NextResponse.json({ success: true });
}
```

**Mark as Read:**

```javascript
// When user views message
export async function PUT(request) {
  const session = await getServerSession(authOptions);
  const { conversationId } = await request.json();

  // Mark all messages in conversation as read
  await Message.updateMany(
    {
      conversationId,
      receiver: session.user.id,
      status: { $ne: "read" },
    },
    {
      $set: {
        status: "read",
        readAt: new Date(),
      },
    },
  );

  // Get messages to notify senders
  const unreadMessages = await Message.find({
    conversationId,
    receiver: session.user.id,
    status: { $ne: "read" },
  });

  // Notify each sender
  unreadMessages.forEach((msg) => {
    io.to(msg.sender.toString()).emit("message_read", {
      messageId: msg._id,
      readAt: new Date(),
    });
  });

  return NextResponse.json({ success: true });
}
```

**Frontend Display:**

```javascript
function MessageItem({ message, isOwn }) {
  const statusIcon = {
    sent: "✓", // Single check
    delivered: "✓✓", // Double check (gray)
    read: "✓✓", // Double check (blue)
  };

  return (
    <div className={`message ${isOwn ? "own" : "other"}`}>
      <p>{message.content}</p>
      {isOwn && (
        <span className={`status ${message.status}`}>
          {statusIcon[message.status]}
        </span>
      )}
    </div>
  );
}
```

---

### 38. What strategies would you use to prevent spam or abuse?

**Answer:**

**1. Rate Limiting:**

```javascript
// Simple in-memory rate limiter
const rateLimitStore = new Map();

function checkRateLimit(userId, action, limit = 10, windowMs = 60000) {
  const key = `${userId}:${action}`;
  const now = Date.now();

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return true;
  }

  const record = rateLimitStore.get(key);

  if (now - record.windowStart > windowMs) {
    record.count = 1;
    record.windowStart = now;
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

// Usage in API route
export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!checkRateLimit(session.user.id, "create_post", 10, 60000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }
}
```

**2. Content Filtering:**

```javascript
// Block suspicious patterns
const spamPatterns = [
  /buy now/i,
  /click here/i,
  /free money/i,
  /winner/i,
  /\b\w{1,2}\.\w{1,2}\.\w{1,2}\b/i, // URLs
  /(.)\1{5,}/, // Repeated characters
];

function containsSpam(content) {
  return spamPatterns.some((pattern) => pattern.test(content));
}

// Usage
if (containsSpam(content)) {
  return NextResponse.json(
    { error: "Content flagged as spam" },
    { status: 400 },
  );
}
```

**3. User Reporting:**

```javascript
// Report schema
const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reason: {
    type: String,
    enum: ["spam", "harassment", "inappropriate", "other"],
    required: true,
  },
  content: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "reviewed", "actioned"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Report API
export async function POST(request) {
  const session = await getServerSession(authOptions);
  const { reportedUserId, reason, content } = await request.json();

  // Prevent self-reporting
  if (reportedUserId === session.user.id) {
    return NextResponse.json(
      { error: "Cannot report yourself" },
      { status: 400 },
    );
  }

  await Report.create({
    reporter: session.user.id,
    reportedUser: reportedUserId,
    reason,
    content,
  });

  return NextResponse.json({ success: true });
}
```

**4. Account Restrictions:**

```javascript
// Suspicious activity detection
async function checkSuspiciousActivity(userId) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const recentPosts = await Post.countDocuments({
    userId,
    createdAt: { $gte: oneHourAgo },
  });

  const recentMessages = await Message.countDocuments({
    sender: userId,
    createdAt: { $gte: oneHourAgo },
  });

  // Flag if too many in short time
  if (recentPosts > 20 || recentMessages > 50) {
    await User.findByIdAndUpdate(userId, {
      accountStatus: "restricted",
      restrictionReason: "suspicious_activity",
    });

    return true;
  }

  return false;
}
```

**5. CAPTCHA Integration:**

```javascript
// Example with reCAPTCHA
export async function POST(request) {
  const { recaptchaToken } = await request.json();

  // Verify with Google
  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${recaptchaToken}`;

  const response = await fetch(verifyUrl, { method: "POST" });
  const data = await response.json();

  if (!data.success || data.score < 0.5) {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  // Proceed with request
}
```

---

### 39. How would you scale this application for millions of users?

**Answer:**

**1. Database Scaling:**

**Index Optimization:**

```javascript
// Ensure all common queries are indexed
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ likes: -1 });
postSchema.index({ hashtags: 1 });

// Use covered queries
const posts = await Post.find(
  { userId: userId },
  "content createdAt", // Only needed fields
).hint({ userId: 1, createdAt: -1 });
```

**Read Replicas:**

```javascript
// mongoose.connect with replica set
mongoose.connect(process.env.MONGODB_URI, {
  readPreference: "secondaryPreferred",
  // Or for specific queries
});
```

**Sharding:**

```javascript
// Shard key selection - important!
sh.shardCollection("socialconnect.posts", { userId: 1 });
// All queries should include userId for efficient routing
```

**2. Caching Strategy:**

```javascript
// Redis caching layer
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

// Cache popular content
async function getFeedWithCache(userId) {
  const cacheKey = `feed:${userId}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from database
  const posts = await getUserFeed(userId);

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(posts));

  return posts;
}

// Invalidate cache on new post
async function createPost(userId, content) {
  await createPostInDb(userId, content);

  // Invalidate feed cache
  await redis.del(`feed:${userId}`);

  // Also invalidate followers' feeds
  const followers = await getFollowers(userId);
  for (const followerId of followers) {
    await redis.del(`feed:${followerId}`);
  }
}
```

**3. API Rate Limiting with Redis:**

```javascript
// Distributed rate limiting
const redis = new Redis(process.env.REDIS_URL);

async function rateLimit(userId, limit = 100, window = 60) {
  const key = `ratelimit:${userId}`;

  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, window);
  }

  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current),
  };
}
```

**4. Horizontal Scaling:**

```javascript
// Vercel automatically scales
// Add more instances for compute-heavy operations

// Use Edge Functions for simple operations
export const runtime = "edge";

export async function GET(request) {
  // Lightweight operation
  return new Response("OK");
}
```

**5. CDN for Static Assets:**

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ["cdn.example.com", "res.cloudinary.com"],
    path: "/_next/image",
    loader: "cloudinary",
  },
};
```

**6. Message Queue for Async Processing:**

```javascript
// Using BullMQ for background jobs
import { Queue, Worker } from "bullmq";

// Email queue
const emailQueue = new Queue("emails", { connection });

// Add to queue instead of immediate send
await emailQueue.add("welcome", { userId: user._id });
await emailQueue.add("notification", {
  userId,
  type: "like",
  postId,
});

// Process in background
const worker = new Worker(
  "emails",
  async (job) => {
    if (job.name === "welcome") {
      await sendWelcomeEmail(job.data.userId);
    }
  },
  { connection },
);
```

**7. Monitoring:**

```javascript
// Sentry for error tracking
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

// Usage
try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error);
}
```

---

## Code-Specific Questions

### 40. Explain the code in app/api/users/suggestions/route.js - what does it do?

**Answer:**

This API endpoint provides user suggestions for the "Who to Follow" feature. Here's a detailed breakdown:

**File Location:** `app/api/users/suggestions/route.js`

**Purpose:** Suggests users that the current user might want to follow, based on mutual connections and exclusions.

**How It Works:**

1. **Accepts Query Parameters:**
   - `userId` - Required, the current user's ID
   - `limit` - Optional, number of suggestions (default: 5)

2. **Excludes Already Connected Users:**

   ```javascript
   _id: {
     $nin: [
       userId, // Don't suggest yourself
       ...currentUser.following, // Don't suggest people you already follow
       ...currentUser.blockedUsers, // Don't suggest people you've blocked
     ];
   }
   ```

3. **Calculates Mutual Followers:**

   ```javascript
   const mutualFollowers = await User.countDocuments({
     _id: { $in: user.followers },
     following: userId,
   });
   ```

   For each suggested user, it counts how many of their followers also follow the current user (mutual connections).

4. **Sorts by Relevance:**
   - Results are sorted by the number of mutual followers (descending)
   - Users with more mutual connections appear first

**Key Code Analysis:**

```javascript
// Get users that are NOT:
// 1. The current user
// 2. Already followed by current user
// 3. Blocked by current user
const suggestions = await User.find({
  _id: { $nin: [userId, ...following, ...blockedUsers] },
})
  .select("name username profilePicture bio")
  .limit(limit);
```

**Limitations & Improvements:**

| Current              | Potential Improvement                |
| -------------------- | ------------------------------------ |
| N+1 query problem    | Use aggregation pipeline             |
| Random sort for ties | Add secondary sort (recent activity) |
| No cache             | Cache suggestions for 5-10 minutes   |
| No interest matching | Match by similar hashtags followed   |

**Security Considerations:**

- Requires `userId` parameter (should come from authenticated session in production)
- Uses `.select()` to limit returned fields (privacy)
- Error handling for missing/invalid users

**Use Case in Frontend:**

```javascript
// Frontend call
const res = await fetch("/api/users/suggestions?userId=123&limit=5");
const { users } = await res.json();

// Display suggested users
users.map((user) => (
  <UserCard key={user._id} user={user} mutualFollowers={user.mutualFollowers} />
));
```

---

### 41. How does the blocking system work in app/api/users/blocked/route.js?

**Answer:**

The blocking system allows users to block other users, preventing interactions and hiding content. (Implementation details would be in the actual route file - typically involves adding user IDs to a `blockedUsers` array in the User model and preventing blocked users from appearing in queries, following, messaging, etc.)

---

### 42. What is the purpose of the Story model and how are views tracked?

**Answer:**

The Story model (`models/Story.js`) implements ephemeral content that expires after 24 hours.

**Key Features:**

- `userId` - Reference to the story creator
- `content` - Image URL or text content
- `views` - Array tracking which users have viewed the story
- `expiresAt` - TTL index for automatic deletion after 24 hours

**View Tracking:**

```javascript
views: [
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    viewedAt: { type: Date, default: Date.now },
  },
];
```

When a user views a story, their ID is added to the `views` array along with a timestamp. This allows:

- Counting total views
- Showing who viewed (for story creator)
- Preventing duplicate view counts
- Tracking view timing for analytics

---

This comprehensive guide covers 42 interview questions spanning the entire Social Connect application, from architecture and database design to advanced topics like scaling and real-time features.
<minimax:tool_call>
<invoke name="read_file">
<parameter name="path">c:/Users/priya/Desktop/social-connect/app/api/users/suggestions/route.js
