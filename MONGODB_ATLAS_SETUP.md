# MongoDB Atlas Setup - Step by Step with Screenshots

## Step 1: Sign Up & Login

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create account with Google or Email
3. Login to Atlas dashboard

## Step 2: Create Cluster (Free)

After login, you'll see the dashboard:

```
┌─────────────────────────────────────────────────────────────┐
│  MongoDB Atlas                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │                                                     │  │
│   │           Create a Cluster                          │  │
│   │                                                     │  │
│   │    [Free]  [Shared]  [Dedicated]                   │  │
│   │                                                     │  │
│   │    M0  Atlas starts free.                          │  │
│   │    No credit card required.                        │  │
│   │                                                     │  │
│   │         [Create Cluster]  ──────────────────────    │  │
│   │                                                     │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

1. Click **"Create Cluster"**
2. Select **"Free"** (M0) tier
3. Click **"Create Cluster"** button at bottom
4. Wait 1-2 minutes for deployment

## Step 3: Create Username & Password

After cluster is created, look at the left sidebar:

```
┌──────────────┬────────────────────────────────────────────┐
│ ATLAS        │  Dashboard                                  │
│              │                                             │
│ > Dashboard  │  ┌──────────────────────────────────────┐  │
│ > Deploy     │  │  cluster0                             │  │
│ > Data API   │  │                                        │  │
│ > Storage    │  │  [Connect] [Metrics] [Collections]   │  │
│              │  └──────────────────────────────────────┘  │
├──────────────┤                                            │
│ SECURITY     │  ┌──────────────────────────────────────┐  │
│ > Database   │  │  How would you like to connect?       │  │
│   Access     │  │                                        │  │
│ > Network    │  │  [Drivers] [MongoDB Shell]           │  │
│   Access     │  │     [ Compass ]                      │  │
│              │  │                                        │  │
└──────────────┴──┴──────────────────────────────────────┴──┘
```

### Where to Add Username/Password:

1. **Click "Database Access"** in the left sidebar under SECURITY:

```
┌─────────────────────────────────────────────────────────────┐
│  Database Access                               [+ Add]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Database Users                     Authentication         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Username     │  Password   │  Privileges           │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │               │              │                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│           [+ Add New Database User]  <-- CLICK THIS       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

2. **Click "+ Add New Database User"**

3. **Fill in the form**:

```
┌─────────────────────────────────────────────────────────────┐
│  Add New User                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Authentication Method: [Password] ← SELECT THIS            │
│                                                             │
│  Username:  [ socialconnect        ]                       │
│                                                             │
│  Password:  [ SocialConnect123     ]  ← Type your password │
│            [🔄 Generate]                                   │
│                                                             │
│  Confirm Password:  [ SocialConnect123 ]                   │
│                                                             │
│  Database User Privileges:                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [✓] Read and write to any database                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  [Add User]                                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

4. **Click "Add User"** button at the bottom!

## Step 4: Network Access (Allow Connection)

1. **Click "Network Access"** in left sidebar under SECURITY

2. **Click "+ Add IP Address"** button

3. **In the "Access List Entry" INPUT BOX, type:**

```
0.0.0.0/0
```

4. **Check the checkbox** "I acknowledge that..."

5. **Click "Confirm"** or "Add" button

That's it! Typing 0.0.0.0/0 allows connections from anywhere.

## Step 5: Get Connection String

1. Go back to **Dashboard**
2. Click **"Connect"** button on your cluster:

```
┌─────────────────────────────────────────────────────────────┐
│  cluster0                                   [Connect]        │
│                                                     [•••]   │
└─────────────────────────────────────────────────────────────┘
```

3. Click **"Connect"** → A modal appears:

```
┌─────────────────────────────────────────────────────────────┐
│  How would you like to connect?                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [ Drivers ]    [ MongoDB Shell ]    [ Compass ]          │
│                                                             │
│  Connect to your cluster using the MongoDB                 │
│  driver for your preferred language.                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

4. **Click "Drivers"**

5. **You'll see your connection string**:

```
┌─────────────────────────────────────────────────────────────┐
│  Drivers                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Add your connection string into your application code:    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ mongodb+srv://<username>:<password>@cluster0.       │    │
│  │ xyz123.mongodb.net/?retryWrites=true&w=majority     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  [ Copy ]  <-- CLICK TO COPY                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

6. **Click "Copy"** button

## Step 6: Update Your .env.local

Open `C:/Users/priya/Desktop/social-connect/.env.local` and replace the connection string:

```
MONGODB_URI=mongodb+srv://socialconnect:SocialConnect123@cluster0.xyz123.mongodb.net/?retryWrites=true&w=majority
```

**Replace with YOUR values:**

- `socialconnect` = Username you created
- `SocialConnect123` = Password you created
- `cluster0.xyz123` = Your actual cluster name (from the connection string)

## Step 7: Run the Project!

```
bash
cd C:/Users/priya/Desktop/social-connect
npm run dev
```

Open **http://localhost:3000** in your browser!

---

## Quick Summary:

| Step | Action            | Location                             |
| ---- | ----------------- | ------------------------------------ |
| 1    | Create Cluster    | Main dashboard                       |
| 2    | Add User          | SECURITY → Database Access → + Add   |
| 3    | Allow IP          | SECURITY → Network Access → + Add    |
| 4    | Get String        | Dashboard → Connect → Drivers → Copy |
| 5    | Update .env.local | Replace MONGODB_URI                  |
| 6    | Run               | `npm run dev`                        |
