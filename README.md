# Spark - A Modern Social Media Platform

A fullstack social media platform built with Next.js, MongoDB, and NextAuth.js.

## Features

### User Authentication

- Sign up with name, username, email, and password
- Login with email and password using NextAuth.js
- JWT-based session management
- Protected routes

### Post Management

- Create posts with text content and images
- Like/unlike posts with reactions
- Comment on posts
- Delete your own posts
- Hashtag support

### Social Features

- Follow/unfollow users
- User search functionality
- View follower/following lists
- Personalized feed from followed users

### User Profiles

- Custom profile with bio and location
- Profile picture support
- View user's posts on profile page

### Notifications

- Get notified when someone likes your post
- Get notified when someone comments on your post
- Get notified when someone follows you

### Messaging

- Real-time chat with other users
- Online status indicators
- Typing indicators

### Stories

- Share temporary stories (24h)
- Image and text stories

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js with JWT
- **Styling**: CSS Modules

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/spark-social.git
cd spark-social
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:
   Create a `.env.local` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/spark
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
JWT_SECRET=your-jwt-secret-here
```

4. Start MongoDB:
   Make sure MongoDB is running on your system or use MongoDB Atlas.

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
spark-social/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── signup/route.js
│   │   │   └── [...nextauth]/route.js
│   │   ├── posts/
│   │   │   ├── route.js
│   │   │   └── [id]/route.js
│   │   ├── users/
│   │   │   ├── route.js
│   │   │   └── [id]/route.js
│   │   └── notifications/route.js
│   ├── home/page.js
│   ├── login/page.js
│   ├── signup/page.js
│   ├── profile/[id]/page.js
│   ├── notifications/page.js
│   ├── explore/page.js
│   ├── chat/page.js
│   ├── layout.js
│   ├── page.js
│   └── globals.css
├── components/
│   └── Providers.js
├── lib/
│   ├── db.js
│   └── auth.js
├── models/
│   ├── User.js
│   ├── Post.js
│   └── Notification.js
├── package.json
├── next.config.js
└── .env.local
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth.js handlers

### Posts

- `GET /api/posts` - Get feed posts
- `POST /api/posts` - Create new post
- `GET /api/posts/[id]` - Get single post
- `PUT /api/posts/[id]` - Like/unlike, comment, or react
- `DELETE /api/posts/[id]` - Delete post

### Users

- `GET /api/users?q=query` - Search users
- `GET /api/users/[id]` - Get user profile
- `PUT /api/users/[id]` - Follow/unfollow user
- `PATCH /api/users/[id]` - Update profile

### Notifications

- `GET /api/notifications?userId=id` - Get notifications
- `PUT /api/notifications` - Mark as read

## License

MIT License

## Author

Created with passion for building great social experiences
