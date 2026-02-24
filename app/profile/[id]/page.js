"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  // Modal states
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (params.id && session?.user?.id) {
      fetchUser();
      fetchPosts();
    }
  }, [params.id, session]);

  const fetchUser = async () => {
    try {
      const res = await axios.get(
        `/api/users/${params.id}?currentUserId=${session?.user?.id}`,
      );
      setUser(res.data.user);
      setIsFollowing(res.data.isFollowing);
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`/api/users/${params.id}`);
      setPosts(res.data.posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const fetchFollowers = async () => {
    setLoadingFollowers(true);
    try {
      const res = await axios.get(
        `/api/users/${params.id}/followers?currentUserId=${session?.user?.id}`,
      );
      setFollowers(res.data.users);
    } catch (error) {
      console.error("Error fetching followers:", error);
    } finally {
      setLoadingFollowers(false);
    }
  };

  const fetchFollowing = async () => {
    setLoadingFollowing(true);
    try {
      const res = await axios.get(
        `/api/users/${params.id}/following?currentUserId=${session?.user?.id}`,
      );
      setFollowing(res.data.users);
    } catch (error) {
      console.error("Error fetching following:", error);
    } finally {
      setLoadingFollowing(false);
    }
  };

  const handleFollowersClick = () => {
    if (followers.length === 0) {
      fetchFollowers();
    }
    setShowFollowersModal(true);
  };

  const handleFollowingClick = () => {
    if (following.length === 0) {
      fetchFollowing();
    }
    setShowFollowingModal(true);
  };

  const handleFollow = async () => {
    try {
      const res = await axios.put(`/api/users/${params.id}`, {
        currentUserId: session.user.id,
        type: "follow",
      });
      setIsFollowing(res.data.isFollowing);
      setUser({ ...user, followers: res.data.user.followers });
    } catch (error) {
      console.error("Error following user:", error);
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

  if (!user) {
    return (
      <div className={styles.errorContainer}>
        <p>User not found</p>
        <Link href="/home">Go back home</Link>
      </div>
    );
  }

  const isOwnProfile = session?.user?.id === params.id;

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
        <h1>{user.name}</h1>
      </header>

      {/* Profile Cover */}
      <div className={styles.coverPhoto}>
        {user.coverPicture ? (
          <img src={user.coverPicture} alt="Cover" />
        ) : (
          <div className={styles.coverPlaceholder}></div>
        )}
      </div>

      {/* Profile Info */}
      <div className={styles.profileInfo}>
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>
            {user.profilePicture ? (
              <img src={user.profilePicture} alt={user.name} />
            ) : (
              user.name?.charAt(0).toUpperCase()
            )}
          </div>

          <div className={styles.profileActions}>
            {!isOwnProfile && (
              <button
                onClick={handleFollow}
                className={`${styles.followButton} ${isFollowing ? styles.following : ""}`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
            {isOwnProfile && (
              <Link href="/edit-profile" className={styles.editButton}>
                Edit Profile
              </Link>
            )}
          </div>
        </div>

        <div className={styles.userDetails}>
          <h2>{user.name}</h2>
          <p className={styles.username}>@{user.username}</p>
          {user.bio && <p className={styles.bio}>{user.bio}</p>}

          <div className={styles.meta}>
            {user.location && (
              <span className={styles.location}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {user.location}
              </span>
            )}
            <span className={styles.joinDate}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Joined{" "}
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          <div className={styles.stats}>
            <button
              className={styles.statButton}
              onClick={handleFollowersClick}
            >
              <span className={styles.statValue}>
                {user.followers?.length || 0}
              </span>
              <span className={styles.statLabel}>Followers</span>
            </button>
            <button
              className={styles.statButton}
              onClick={handleFollowingClick}
            >
              <span className={styles.statValue}>
                {user.following?.length || 0}
              </span>
              <span className={styles.statLabel}>Following</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "posts" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          Posts
        </button>
        <button
          className={`${styles.tab} ${activeTab === "media" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("media")}
        >
          Media
        </button>
      </div>

      {/* Posts */}
      <div className={styles.content}>
        {posts.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No posts yet</p>
          </div>
        ) : (
          posts.map((post) => (
            <article key={post._id} className={styles.post}>
              <div className={styles.postHeader}>
                <div className={styles.postAvatar}>
                  {post.userId?.name?.charAt(0).toUpperCase()}
                </div>
                <div className={styles.postUserInfo}>
                  <span className={styles.postUserName}>
                    {post.userId?.name}
                  </span>
                  <span className={styles.postTime}>
                    • {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {post.userId?._id === session?.user?.id && (
                  <button
                    onClick={() => handleDelete(post._id)}
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
                  onClick={() => handleLike(post._id)}
                  className={`${styles.actionBtn} ${post.likes?.includes(session?.user?.id) ? styles.liked : ""}`}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill={
                      post.likes?.includes(session?.user?.id)
                        ? "currentColor"
                        : "none"
                    }
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span>{post.likes?.length || 0}</span>
                </button>
                <button className={styles.actionBtn}>
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
            </article>
          ))
        )}
      </div>

      {/* Followers Modal */}
      {showFollowersModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowFollowersModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Followers</h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowFollowersModal(false)}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className={styles.modalContent}>
              {loadingFollowers ? (
                <div className={styles.modalLoading}>
                  <div className={styles.spinner}></div>
                </div>
              ) : followers.length === 0 ? (
                <div className={styles.emptyList}>
                  <p>No followers yet</p>
                </div>
              ) : (
                <ul className={styles.userList}>
                  {followers.map((follower) => (
                    <li key={follower._id} className={styles.userListItem}>
                      <Link
                        href={`/profile/${follower._id}`}
                        className={styles.userListLink}
                      >
                        <div className={styles.userListAvatar}>
                          {follower.profilePicture ? (
                            <img
                              src={follower.profilePicture}
                              alt={follower.name}
                            />
                          ) : (
                            follower.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className={styles.userListInfo}>
                          <span className={styles.userListName}>
                            {follower.name}
                          </span>
                          <span className={styles.userListUsername}>
                            @{follower.username}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowFollowingModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Following</h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowFollowingModal(false)}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className={styles.modalContent}>
              {loadingFollowing ? (
                <div className={styles.modalLoading}>
                  <div className={styles.spinner}></div>
                </div>
              ) : following.length === 0 ? (
                <div className={styles.emptyList}>
                  <p>Not following anyone yet</p>
                </div>
              ) : (
                <ul className={styles.userList}>
                  {following.map((user) => (
                    <li key={user._id} className={styles.userListItem}>
                      <Link
                        href={`/profile/${user._id}`}
                        className={styles.userListLink}
                      >
                        <div className={styles.userListAvatar}>
                          {user.profilePicture ? (
                            <img src={user.profilePicture} alt={user.name} />
                          ) : (
                            user.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className={styles.userListInfo}>
                          <span className={styles.userListName}>
                            {user.name}
                          </span>
                          <span className={styles.userListUsername}>
                            @{user.username}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
