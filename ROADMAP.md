# 🚀 SocialConnect App - Complete Roadmap

This is a step-by-step roadmap to get your SocialConnect social media app up and running.

---

## 📋 Phase 1: Prerequisites Setup

### 1.1 Install Required Software

| Software | Version | Download Link                                  |
| -------- | ------- | ---------------------------------------------- |
| Node.js  | v18+    | https://nodejs.org/                            |
| MongoDB  | Latest  | https://www.mongodb.com/try/download/community |
| Git      | Latest  | https://git-scm.com/                           |

### 1.2 Verify Installations

```bash
node --version    # Should show v18 or higher
npm --version     # Should show 6 or higher
git --version     # Should show git version
```

---

## 📋 Phase 2: Project Setup

### 2.1 Clone the Project

```bash
# Open terminal and run:
git clone <your-repo-url>
cd social-connect
```

### 2.2 Install Dependencies

```bash
npm install
```

This will install all required packages:

- Next.js 14
- React 18
- MongoDB with Mongoose
- NextAuth.js
- Axios
- And more...

---

## 📋 Phase 3: Environment Configuration

### 3.1 Create Environment File

Create a new file named `.env.local` in the root directory:

```env
# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/socialconnect

# For MongoDB Atlas (cloud), use:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/socialconnect

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-change-this

# JWT Secret
JWT_SECRET=your-jwt-secret-key-change-this
```

### 3.2 Generate Secure Secrets

```bash
# Run this to generate a random secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📋 Phase 4: Database Setup

### Option A: Local MongoDB

1. **Install MongoDB Community Server**
   - Download from https://www.mongodb.com/try/download/community
   - Run the installer
   - Complete installation

2. **Start MongoDB Service**

   Windows (Command Prompt as Administrator):

   ```bash
   net start MongoDB
   ```

   Or start manually:

   ```bash
   "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"
   ```

3. **Verify MongoDB is Running**
   - MongoDB runs on `localhost:27017` by default

### Option B: MongoDB Atlas (Cloud) - Recommended

1. **Create Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free account

2. **Create Cluster**
   - Click "Build a Cluster"
   - Choose FREE tier (M0)
   - Select nearest region
   - Click "Create Cluster" (wait 1-2 minutes)

3. **Create Database User**
   - Go to "Database Access"
   - Add new user with username/password
   - Remember these credentials!

4. **Network Access**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (0.0.0.0/0)

5. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

6. **Update .env.local**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.xxx.mongodb.net/socialconnect
   ```

---

## 📋 Phase 5: Run the Application

### 5.1 Start Development Server

```bash
npm run dev
```

### 5.2 Access the App

Open your browser and go to:

- **http://localhost:3000** - Main app
- **http://localhost:3000/login** - Login page
- **http://localhost:3000/signup** - Signup page

---

## 📋 Phase 6: App Features Guide

### After Running the App, You Can:

| Feature           | How to Use                                           |
| ----------------- | ---------------------------------------------------- |
| **Sign Up**       | Go to /signup, enter name, username, email, password |
| **Log In**        | Go to /login, enter email and password               |
| **Create Post**   | On home page, type message and click post            |
| **Like Posts**    | Click heart icon on any post                         |
| **Follow Users**  | Search for users, click follow button                |
| **View Profile**  | Click on your username to see your profile           |
| **Notifications** | Click bell icon to see likes, comments, follows      |
| **Chat**          | Go to /chat to message other users                   |

---

## 📋 Phase 7: Building for Production

### 7.1 Create Production Build

```bash
npm run build
```

This creates an optimized production build.

### 7.2 Start Production Server

```bash
npm start
```

---

## 📋 Phase 8: Deployment Options

### Option 1: Vercel (Recommended for Next.js)

1. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/social-connect.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to https://vercel.com
   - Sign up with GitHub
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables:
     - `MONGODB_URI`
     - `NEXTAUTH_URL`
     - `NEXTAUTH_SECRET`
     - `JWT_SECRET`
   - Click "Deploy"

3. **Your app will be live at:** `https://your-project.vercel.app`

### Option 2: Render.com (Free)

1. Push code to GitHub
2. Go to https://render.com
3. Create "Web Service"
4. Connect GitHub repo
5. Set build command: `npm run build`
6. Set start command: `npm start`
7. Add environment variables

### Option 3: Railway

1. Go to https://railway.app
2. Create new project
3. Connect GitHub repo
4. Add MongoDB plugin
5. Deploy

---

## 📋 Phase 9: Troubleshooting Common Issues

### Issue: "MongoDB connection failed"

**Solution:**

- Make sure MongoDB is running: `net start MongoDB` (Windows)
- Check your MONGODB_URI in .env.local
- For Atlas, check username/password is correct

### Issue: "NextAuth secret error"

**Solution:**

- Generate new secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Update NEXTAUTH_SECRET in .env.local

### Issue: "Port 3000 already in use"

**Solution:**

```bash
# Find and kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue: "Module not found"

**Solution:**

```bash
# Delete node_modules and reinstall
rmdir /s /node_modules
npm install
```

---

## 📋 Quick Start Summary

```bash
# 1. Clone & Install
git clone <repo-url>
cd social-connect
npm install

# 2. Setup .env.local (see Phase 3)

# 3. Start MongoDB (local) OR use MongoDB Atlas

# 4. Run app
npm run dev

# 5. Open http://localhost:3000
```

---

## 📞 Need Help?

- **Next.js Docs:** https://nextjs.org/docs
- **MongoDB Docs:** https://docs.mongodb.com/
- **NextAuth Docs:** https://next-auth.js.org/

---

**Happy Coding! 🎉**
