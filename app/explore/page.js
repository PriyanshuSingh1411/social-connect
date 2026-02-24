"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import styles from "./explore.module.css";

export default function ExplorePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPosts();
    }
  }, [status]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchContent();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchPosts = async () => {
    try {
      const res = await axios.get("/api/posts");
      setPosts(res.data.posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchContent = async () => {
    try {
      // Search users
      const usersRes = await axios.get(`/api/users?q=${searchQuery}`);
      // Search posts by hashtags
      const postsRes = await axios.get(`/api/posts/hashtags?q=${searchQuery}`);

      setSearchResults({
        users: usersRes.data.users,
        posts: postsRes.data.posts || [],
      });
    } catch (error) {
      console.error("Error searching:", error);
    }
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

  if (status === "loading" || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <Link href="/home" className={styles.backButton}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <h1>Explore</h1>
      </header>

      {/* Search Bar */}
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
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Search Results or Explore Grid */}
      {searchQuery.length > 2 ? (
        <div className={styles.searchResults}>
          {/* Users Results */}
          {searchResults.users?.length > 0 && (
            <div className={styles.section}>
              <h3>Accounts</h3>
              <div className={styles.usersList}>
                {searchResults.users.map((user) => (
                  <Link
                    key={user._id}
                    href={`/profile/${user._id}`}
                    className={styles.userItem}
                  >
                    <div className={styles.userAvatar}>
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt={user.name} />
                      ) : (
                        user.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{user.name}</span>
                      <span className={styles.userHandle}>
                        @{user.username}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Posts Results */}
          {searchResults.posts?.length > 0 && (
            <div className={styles.section}>
              <h3>Posts</h3>
              <div className={styles.postsGrid}>
                {searchResults.posts.map((post) => (
                  <Link
                    key={post._id}
                    href={`/post/${post._id}`}
                    className={styles.gridPost}
                  >
                    {post.img && <img src={post.img} alt="Post" />}
                    <div className={styles.postOverlay}>
                      <span>❤️ {post.likes?.length || 0}</span>
                      <span>💬 {post.comments?.length || 0}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {!searchResults.users?.length && !searchResults.posts?.length && (
            <div className={styles.noResults}>
              <p>No results found for "{searchQuery}"</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === "posts" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("posts")}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Posts
            </button>
            <button
              className={`${styles.tab} ${activeTab === "hashtags" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("hashtags")}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="4" y1="9" x2="20" y2="9" />
                <line x1="4" y1="15" x2="20" y2="15" />
                <line x1="10" y1="3" x2="8" y2="21" />
                <line x1="16" y1="3" x2="14" y2="21" />
              </svg>
              Hashtags
            </button>
          </div>

          {/* Posts Grid */}
          <div className={styles.postsGrid}>
            {posts.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No posts to explore yet</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post._id} className={styles.gridPost}>
                  {post.img ? (
                    <img src={post.img} alt="Post" />
                  ) : (
                    <div className={styles.textPost}>
                      <p>{post.desc?.substring(0, 100)}</p>
                    </div>
                  )}
                  <div className={styles.postOverlay}>
                    <span>❤️ {post.likes?.length || 0}</span>
                    <span>💬 {post.comments?.length || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
