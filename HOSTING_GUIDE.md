# Hosting Guide for SocialConnect

This guide will help you deploy your SocialConnect application to the web.

## Option 1: Vercel (Recommended for Next.js)

Vercel is the best platform for hosting Next.js applications - it's free for students and very easy to use.

### Steps:

1. **Push your code to GitHub**
   - Create a GitHub repository
   - Upload all files from `C:/Users/priya/Desktop/social-connect`
2. **Deploy to Vercel**
   - Go to https://vercel.com
   - Sign up with your GitHub account
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will automatically detect it's a Next.js app

3. **Configure Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add these variables:

```
     MONGODB_URI=your_mongodb_connection_string
     NEXTAUTH_URL=https://your-app.vercel.app
     NEXTAUTH_SECRET=generate_a_random_secret_key
     JWT_SECRET=generate_a_random_secret_key

```

4. **MongoDB Database**
   - Create a free MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
   - Create a free cluster
   - Get your connection string and add it to Vercel

5. **Deploy**
   - Click "Deploy" and your app will be live!

---

## Option 2: Render.com (Free Alternative)

### Steps:

1. **Push code to GitHub**

2. **Create Web Service on Render**
   - Go to https://render.com
   - Create a new Web Service
   - Connect your GitHub repository

3. **Configure:**
   - Build Command: `npm run build`
   - Start Command: `npm start`

4. **Add Environment Variables**
   - Add the same environment variables as above

---

## Option 3: Railway (Easy for Fullstack)

### Steps:

1. **Push code to GitHub**

2. **Create Railway Project**
   - Go to https://railway.app
   - Create new project from GitHub repo

3. **Add MongoDB**
   - In Railway dashboard, click "New" → "Database" → "MongoDB"

4. **Deploy**
   - Railway will automatically set the MONGODB_URI

---

## Getting MongoDB Atlas Free Database:

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create free cluster (选择免费的 M0 Sandbox)
4. Create database user (username/password)
5. Network Access → Allow All IPs (0.0.0.0/0)
6. Get Connection String:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password

---

## Important Notes:

### For Production:

1. Change `NEXTAUTH_SECRET` to a secure random string
2. Use environment variables for all secrets
3. Update `NEXTAUTH_URL` to your actual domain

### Generate Secret Keys:

Run this in Node.js:

```
javascript
require('crypto').randomBytes(32).toString('hex')
```

---

## Quick Test Before Hosting:

Make sure your app works locally with `npm run dev` before deploying!

---

## Student Discounts:

- Vercel Pro is free for students (verify with .edu email)
- GitHub Student Pack includes Vercel Pro
