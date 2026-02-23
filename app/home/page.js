"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import styles from "./home.module.css";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchPosts();
    }
  }, [session]);

  useEffect(() => {
    if (searchQuery.length > 0) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`/api/posts?userId=${session.user.id}`);
      setPosts(res.data.posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
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

  if (status === "loading" || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Left Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarContent}>
          <Link href="/home" className={styles.logo}>
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>SocialConnect</span>
          </Link>

          <nav className={styles.nav}>
            <Link href="/home" className={styles.navItemActive}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Home</span>
            </Link>
            <Link
              href={`/profile/${session?.user?.id}`}
              className={styles.navItem}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Profile</span>
            </Link>
            <Link href="/notifications" className={styles.navItem}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span>Notifications</span>
            </Link>
            <Link href="/chat" className={styles.navItem}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>Chat</span>
            </Link>
          </nav>

          <button
            className={styles.postButton}
            onClick={() => document.getElementById("postInput")?.focus()}
          >
            Post
          </button>

          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {session?.user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{session?.user?.name}</span>
              <span className={styles.userHandle}>
                @{session?.user?.username}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Home</h1>
        </header>

        {/* Create Post */}
        <div className={styles.createPost}>
          <div className={styles.createPostInput}>
            <div className={styles.createPostAvatar}>
              {session?.user?.name?.charAt(0).toUpperCase()}
            </div>
            <form onSubmit={handlePost} className={styles.postForm}>
              <input
                id="postInput"
                type="text"
                placeholder="What's happening?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className={styles.postInput}
              />
              <div className={styles.postActions}>
                <label htmlFor="imageInput" className={styles.imageUploadLabel}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect
                      x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                    ></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </label>
                <input
                  id="imageInput"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className={styles.imageInput}
                />
                <button
                  type="submit"
                  className={styles.postSubmit}
                  disabled={posting || (!newPost.trim() && !selectedImage)}
                >
                  {posting ? "Posting..." : "Post"}
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
              <p>No posts yet. Be the first to post!</p>
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
              />
            ))
          )}
        </div>
      </main>

      {/* Right Sidebar - Search */}
      <aside className={styles.rightSidebar}>
        <div className={styles.searchContainer}>
          <div className={styles.searchBox}>
            <svg
              width="18"
              height="18"
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
              placeholder="Search users..."
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

          <div className={styles.trending}>
            <h3>Who to follow</h3>
            <p className={styles.trendingHint}>Find friends to follow</p>
          </div>
        </div>
      </aside>
    </div>
  );
}

function PostCard({ post, currentUserId, onLike, onComment, onDelete }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isLiked, setIsLiked] = useState(post.likes?.includes(currentUserId));

  const handleLikeClick = () => {
    setIsLiked(!isLiked);
    onLike(post._id);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    onComment(post._id, commentText);
    setCommentText("");
    setShowComments(true);
  };

  return (
    <article className={styles.post}>
      <div className={styles.postHeader}>
        <Link
          href={`/profile/${post.userId?._id}`}
          className={styles.postAvatar}
        >
          {post.userId?.name?.charAt(0).toUpperCase()}
        </Link>
        <div className={styles.postUserInfo}>
          <Link
            href={`/profile/${post.userId?._id}`}
            className={styles.postUserName}
          >
            {post.userId?.name}
          </Link>
          <span className={styles.postUserHandle}>
            @{post.userId?.username}
          </span>
          <span className={styles.postTime}>
            • {new Date(post.createdAt).toLocaleDateString()}
          </span>
        </div>
        {post.userId?._id === currentUserId && (
          <button
            onClick={() => onDelete(post._id)}
            className={styles.deleteBtn}
          >
            <svg
              width="16"
              height="16"
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
        <p>{post.desc}</p>
        {post.img && (
          <img src={post.img} alt="Post" className={styles.postImage} />
        )}
      </div>

      <div className={styles.postActions}>
        <button
          onClick={handleLikeClick}
          className={`${styles.actionBtn} ${isLiked ? styles.liked : ""}`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={isLiked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span>{post.likes?.length || 0}</span>
        </button>

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
      </div>

      {showComments && (
        <div className={styles.commentsSection}>
          {post.comments?.map((comment, index) => (
            <div key={index} className={styles.comment}>
              <div className={styles.commentAvatar}>
                {comment.userId?.name?.charAt(0).toUpperCase()}
              </div>
              <div className={styles.commentContent}>
                <span className={styles.commentUserName}>
                  {comment.userId?.name}
                </span>
                <p>{comment.text}</p>
              </div>
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
