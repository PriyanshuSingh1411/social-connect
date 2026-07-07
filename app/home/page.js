"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useTheme } from "@/components/ThemeProvider";
import styles from "./home.module.css";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchPosts();
      fetchUnreadCount();
    }
  }, [session]);

  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get(
        `/api/notifications?userId=${session.user.id}`,
      );
      setUnreadCount(res.data.unreadCount || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.length > 0) {
        searchUsers();
      } else {
        setUsers([]);
      }
    }, 300);
    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const fetchPosts = async () => {
    try {
      const res = await axios.get("/api/posts");
      setPosts(res.data.posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      try {
        const res = await axios.get(`/api/posts?userId=${session.user.id}`);
        setPosts(res.data.posts);
      } catch (fallbackError) {
        console.error("Error fetching posts (fallback):", fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    try {
      const res = await axios.get(`/api/users?q=${searchQuery}`);
      setUsers(res.data.users);
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if ((!newPost.trim() && !selectedImage) || posting) return;

    setPosting(true);
    try {
      const res = await axios.post("/api/posts", {
        userId: session.user.id,
        desc: newPost,
        img: selectedImage,
      });
      setPosts([res.data.post, ...posts]);
      setNewPost("");
      setSelectedImage(null);
      setShowImagePreview(false);
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setPosting(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        setShowImagePreview(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setShowImagePreview(false);
  };

  const handleLike = async (postId) => {
    try {
      const res = await axios.put(`/api/posts/${postId}`, {
        userId: session.user.id,
        type: "like",
      });
      setPosts(
        posts.map((post) => (post._id === postId ? res.data.post : post)),
      );
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleComment = async (postId, commentText) => {
    if (!commentText.trim()) return;
    try {
      const res = await axios.put(`/api/posts/${postId}`, {
        userId: session.user.id,
        type: "comment",
        commentText,
      });
      setPosts(
        posts.map((post) => (post._id === postId ? res.data.post : post)),
      );
    } catch (error) {
      console.error("Error commenting:", error);
    }
  };

  const handleDelete = async (postId) => {
    try {
      await axios.delete(`/api/posts/${postId}?userId=${session.user.id}`);
      setPosts(posts.filter((post) => post._id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      const res = await axios.put(`/api/posts/${postId}`, {
        userId: session.user.id,
        type: "deleteComment",
        commentText: commentId,
      });
      setPosts(
        posts.map((post) => (post._id === postId ? res.data.post : post)),
      );
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  const navItems = [
    {
      href: "/home",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      label: "Home",
      active: pathname === "/home",
    },
    {
      href: "/explore",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
      label: "Explore",
      active: pathname === "/explore",
    },
    {
      href: "/trending",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      ),
      label: "Trending",
      active: pathname === "/trending",
    },
    {
      href: "/chat",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      label: "Chat",
      active: pathname === "/chat",
    },
    {
      href: "/notifications",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
      label: "Alerts",
      active: pathname === "/notifications",
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      href: "/stories",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
          <line x1="21.17" y1="8" x2="12" y2="8" />
          <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
          <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
        </svg>
      ),
      label: "Stories",
      active: pathname === "/stories",
    },
  ];

  return (
    <div className={styles.container}>
      {/* Animated Background */}
      <div className={styles.backgroundBlur}>
        <div className={styles.bgBlob1}></div>
        <div className={styles.bgBlob2}></div>
        <div className={styles.bgBlob3}></div>
      </div>

      {/* Floating Sidebar Navigation */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <div className={styles.sidebarLogoIcon}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </div>
          <span className={styles.sidebarLogoText}>Spark</span>
        </div>

        <nav className={styles.sidebarNav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.sidebarNavItem} ${item.active ? styles.active : ""}`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && (
                <span className={styles.navBadge}>{item.badge}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* User Profile */}
        <Link
          href={`/profile/${session?.user?.id}`}
          className={styles.sidebarUser}
        >
          <div className={styles.sidebarUserAvatar}>
            {session?.user?.profilePicture ? (
              <img src={session.user.profilePicture} alt={session.user.name} />
            ) : (
              session?.user?.name?.charAt(0).toUpperCase()
            )}
          </div>
          <div className={styles.sidebarUserInfo}>
            <div className={styles.sidebarUserName}>{session?.user?.name}</div>
            <div className={styles.sidebarUserHandle}>
              @{session?.user?.username}
            </div>
          </div>
        </Link>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Top Bar */}
        <div className={styles.topBar}>
          <div className={styles.searchContainer}>
            <div className={styles.searchBox}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            {users.length > 0 && (
              <div className={styles.searchResults}>
                {users.map((user) => (
                  <Link
                    key={user._id}
                    href={`/profile/${user._id}`}
                    className={styles.searchResultItem}
                  >
                    <div className={styles.searchResultAvatar}>
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className={styles.searchResultName}>{user.name}</div>
                      <div className={styles.searchResultHandle}>
                        @{user.username}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className={styles.themeToggle}
            title={theme === "dark" ? "Light Mode" : "Dark Mode"}
          >
            {theme === "dark" ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>

        {/* Create Post Card */}
        <div className={styles.createPostCard}>
          <div className={styles.createPostHeader}>
            <Link
              href={`/profile/${session?.user?.id}`}
              className={styles.createPostAvatar}
            >
              {session?.user?.profilePicture ? (
                <img
                  src={session.user.profilePicture}
                  alt={session.user.name}
                />
              ) : (
                session?.user?.name?.charAt(0).toUpperCase()
              )}
            </Link>
            <form onSubmit={handlePost} className={styles.createPostForm}>
              <input
                id="postInput"
                type="text"
                placeholder="Share your thoughts..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className={styles.postInput}
              />
              <div className={styles.postActions}>
                <div className={styles.postActionsLeft}>
                  <label
                    htmlFor="imageInput"
                    className={styles.imageUploadLabel}
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </label>
                  <input
                    id="imageInput"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className={styles.imageInput}
                  />
                </div>
                <button
                  type="submit"
                  className={styles.postSubmit}
                  disabled={posting || (!newPost.trim() && !selectedImage)}
                >
                  {posting ? "Sharing..." : "Share"}
                </button>
              </div>
            </form>
          </div>
          {selectedImage && (
            <div className={styles.imagePreview}>
              <img src={selectedImage} alt="Preview" />
              <button
                type="button"
                onClick={removeImage}
                className={styles.removeImage}
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Posts Feed */}
        <div className={styles.feed}>
          {posts.length === 0 ? (
            <div className={styles.emptyFeed}>
              <svg
                width="72"
                height="72"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p>No posts yet. Be the first to share something!</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                currentUserId={session?.user?.id}
                onLike={handleLike}
                onComment={handleComment}
                onDelete={handleDelete}
                onDeleteComment={handleDeleteComment}
              />
            ))
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      <button
        className={styles.floatingBtn}
        onClick={() => document.getElementById("postInput")?.focus()}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Mobile Bottom Navigation */}
      <nav className={styles.mobileNav}>
        {navItems.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.mobileNavItem} ${item.active ? styles.active : ""}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function PostCard({
  post,
  currentUserId,
  onLike,
  onComment,
  onDelete,
  onDeleteComment,
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isLiked, setIsLiked] = useState(post.likes?.includes(currentUserId));
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState(post.desc || "");
  const [showReactions, setShowReactions] = useState(false);
  const [userReaction, setUserReaction] = useState(null);

  const reactionsList = [
    { name: "like", emoji: "👍" },
    { name: "love", emoji: "❤️" },
    { name: "haha", emoji: "😂" },
    { name: "wow", emoji: "😮" },
    { name: "sad", emoji: "😢" },
    { name: "angry", emoji: "😡" },
  ];

  const getTotalReactions = () => {
    if (!post.reactions) return 0;
    const reactions = post.reactions;
    let total = 0;
    for (const key in reactions) {
      if (key.startsWith("user_")) continue;
      total += reactions[key] || 0;
    }
    return total;
  };

  const handleLikeClick = () => {
    setIsLiked(!isLiked);
    onLike(post._id);
  };

  const handleReaction = async (reactionName) => {
    try {
      const res = await axios.put(`/api/posts/${post._id}`, {
        userId: currentUserId,
        type: "react",
        reaction: reactionName,
      });
      setUserReaction(reactionName);
      setShowReactions(false);
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  const handleBookmark = async () => {
    try {
      const res = await axios.put(`/api/posts/${post._id}`, {
        userId: currentUserId,
        type: "bookmark",
      });
      setIsBookmarked(res.data.isBookmarked);
    } catch (error) {
      console.error("Error bookmarking post:", error);
    }
  };

  const handleEdit = async () => {
    if (!editDesc.trim()) return;
    try {
      const res = await axios.put(`/api/posts/${post._id}`, {
        userId: currentUserId,
        type: "edit",
        newDesc: editDesc,
      });
      post.desc = res.data.post.desc;
      setIsEditing(false);
    } catch (error) {
      console.error("Error editing post:", error);
    }
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    onComment(post._id, commentText);
    setCommentText("");
    setShowComments(true);
  };

  return (
    <article className={styles.postCard}>
      <div className={styles.postHeader}>
        <Link
          href={`/profile/${post.userId?._id}`}
          className={styles.postAvatar}
        >
          {post.userId?.profilePicture ? (
            <img src={post.userId.profilePicture} alt={post.userId.name} />
          ) : (
            post.userId?.name?.charAt(0).toUpperCase()
          )}
        </Link>
        <div className={styles.postUserInfo}>
          <Link
            href={`/profile/${post.userId?._id}`}
            className={styles.postUserName}
          >
            {post.userId?.name}
          </Link>
          <div className={styles.postMeta}>
            <span className={styles.postUserHandle}>
              @{post.userId?.username}
            </span>
            <span className={styles.postTime}>
              • {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        {post.userId?._id === currentUserId && (
          <button
            onClick={() => onDelete(post._id)}
            className={styles.postMenu}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>

      <div className={styles.postContent}>
        {isEditing ? (
          <div className={styles.editForm}>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className={styles.editTextarea}
              rows={3}
              autoFocus
            />
            <div className={styles.editActions}>
              <button
                onClick={() => setIsEditing(false)}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button onClick={handleEdit} className={styles.saveBtn}>
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <p>
              {post.desc}
              {post.isEdited && (
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--foreground-muted)",
                    marginLeft: "8px",
                  }}
                >
                  (edited)
                </span>
              )}
            </p>
            {post.img && (
              <img src={post.img} alt="Post" className={styles.postImage} />
            )}
          </>
        )}
      </div>

      <div className={styles.postActions}>
        {/* Reaction Button */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowReactions(!showReactions)}
            className={`${styles.actionBtn} ${userReaction ? styles.liked : ""}`}
          >
            <span>
              {userReaction
                ? reactionsList.find((r) => r.name === userReaction)?.emoji
                : "👍"}
            </span>
            <span>{getTotalReactions() || post.likes?.length || 0}</span>
          </button>
          {showReactions && (
            <div className={styles.reactionsPopup}>
              {reactionsList.map((reaction) => (
                <button
                  key={reaction.name}
                  onClick={() => handleReaction(reaction.name)}
                  className={styles.reactionOption}
                >
                  {reaction.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowComments(!showComments)}
          className={styles.actionBtn}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          <span>{post.comments?.length || 0}</span>
        </button>

        <button
          onClick={handleBookmark}
          className={`${styles.actionBtn} ${isBookmarked ? styles.liked : ""}`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={isBookmarked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>

      {showComments && (
        <div className={styles.commentsSection}>
          {post.comments?.map((comment, index) => (
            <div key={index} className={styles.comment}>
              <div className={styles.commentAvatar}>
                {comment.userId?.profilePicture ? (
                  <img
                    src={comment.userId.profilePicture}
                    alt={comment.userId.name}
                  />
                ) : (
                  comment.userId?.name?.charAt(0).toUpperCase()
                )}
              </div>
              <div className={styles.commentContent}>
                <span className={styles.commentUserName}>
                  {comment.userId?.name}
                </span>
                <p>{comment.text}</p>
              </div>
              {comment.userId?._id === currentUserId && (
                <button
                  onClick={() => onDeleteComment(post._id, comment._id)}
                  className={styles.commentDeleteBtn}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className={styles.commentInput}
            />
            <button type="submit" className={styles.commentSubmit}>
              Reply
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
