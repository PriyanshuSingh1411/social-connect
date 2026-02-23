# Deploy to Vercel - Step by Step

## Step 1: Push Code to GitHub

### Option A: Using GitHub Website (Easiest)

1. Go to https://github.com and sign in
2. Click "+" icon → "New repository"
3. Name: `social-connect`
4. Click "Create repository"
5. On the next page, scroll to "Push an existing folder"
6. Copy those commands

### Option B: Using GitHub Desktop

1. Download GitHub Desktop from https://desktop.github.com
2. Install and sign in
3. Click "Add Existing Repository"
4. Select `C:/Users/priya/Desktop/social-connect`
5. Click "Publish repository"

---

## Step 2: Deploy to Vercel

1. Go to https://vercel.com and sign up with GitHub
2. Click "Add New" → "Project"
3. Find and import your `social-connect` repository
4. Click "Deploy"!

---

## Step 3: Add MongoDB Database

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create free cluster (M0 Sandbox - FREE)
4. Create user: username & password
5. Network Access → Add IP: 0.0.0.0/0
6. Click "Connect" → "Connect your application"
7. Copy connection string (replace password)

---

## Step 4: Add Environment Variables

In Vercel dashboard:

1. Go to your project → Settings → Environment Variables
2. Add:
   - MONGODB_URI = your_mongodb_connection_string
   - NEXTAUTH_URL = https://your-project.vercel.app
   - NEXTAUTH_SECRET = (run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   - JWT_SECRET = (same as above)

3. Redeploy: Go to Deployments → Click latest → "Redeploy"

---

## Done! 🎉

Your app will be live at: https://social-connect.vercel.app
