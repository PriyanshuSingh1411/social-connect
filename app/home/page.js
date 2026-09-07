"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import AppShell from "@/components/AppShell";
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

  const [selectedImage, setSelectedImage] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePostId, setDeletePostId] = useState(null);
  const [deletingPost, setDeletingPost] = useState(false);

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch posts after session is available
  useEffect(() => {
    if (session?.user?.id) {
      fetchPosts();
    }
  }, [session]);

  // Search users
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
        const res = await axios.get(
          `/api/posts?userId=${session.user.id}`
        );
        setPosts(res.data.posts);
      } catch (fallbackError) {
        console.error(
          "Error fetching posts (fallback):",
          fallbackError
        );
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

  // Create a new post
  const handlePost = async (e) => {
    e.preventDefault();

    if (
      (!newPost.trim() && !selectedImage) ||
      posting ||
      uploadingImage
    ) {
      return;
    }

    setPosting(true);

    try {
      const res = await axios.post("/api/posts", {
        userId: session.user.id,
        desc: newPost,
        img: selectedImage,
      });

      setPosts((currentPosts) => [
        res.data.post,
        ...currentPosts,
      ]);

      setNewPost("");
      setSelectedImage(null);
      setShowImagePreview(false);
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setPosting(false);
    }
  };

  // Upload image to Cloudinary
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Basic validation
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      e.target.value = "";
      return;
    }

    // 10 MB limit
    if (file.size > 10 * 1024 * 1024) {
      alert("Image size must be less than 10 MB.");
      e.target.value = "";
      return;
    }

    setUploadingImage(true);

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const folder = "socialconnect/posts";

      // The signing API expects paramsToSign
      const paramsToSign = {
        timestamp,
        folder,
      };

      // Get signature from our server
      const signatureResponse = await axios.post(
        "/api/sign-cloudinary-params",
        {
          paramsToSign,
        }
      );

      const { signature } = signatureResponse.data;

      if (!signature) {
        throw new Error(
          "Cloudinary signature was not returned."
        );
      }

      // Upload directly to Cloudinary
      const formData = new FormData();

      formData.append("file", file);
      formData.append(
        "api_key",
        process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY
      );
      formData.append(
        "timestamp",
        timestamp.toString()
      );
      formData.append("folder", folder);
      formData.append("signature", signature);

      const cloudinaryResponse = await axios.post(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData
      );

      const imageUrl =
        cloudinaryResponse.data.secure_url;

      if (!imageUrl) {
        throw new Error(
          "Cloudinary did not return an image URL."
        );
      }

      // Store only the Cloudinary URL
      setSelectedImage(imageUrl);
      setShowImagePreview(true);

      console.log(
        "Cloudinary upload successful:",
        imageUrl
      );
    } catch (error) {
      console.error(
        "Cloudinary upload error:",
        error
      );

      alert(
        error.response?.data?.error ||
          error.message ||
          "Failed to upload image. Please try again."
      );

      setSelectedImage(null);
      setShowImagePreview(false);
    } finally {
      setUploadingImage(false);

      // Allow selecting the same image again
      e.target.value = "";
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setShowImagePreview(false);
  };

  // Like a post
  const handleLike = async (postId) => {
    try {
      const res = await axios.put(
        `/api/posts/${postId}`,
        {
          userId: session.user.id,
          type: "like",
        }
      );

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post._id === postId
            ? res.data.post
            : post
        )
      );
    } catch (error) {
      console.error(
        "Error liking post:",
        error
      );
    }
  };

  // Add comment
const handleComment = (
  postId,
  updatedPost
) => {
  setPosts((currentPosts) =>
    currentPosts.map((post) =>
      post._id === postId
        ? updatedPost
        : post
    )
  );
};

  // Open delete confirmation modal
  const handleDelete = (postId) => {
    setDeletePostId(postId);
    setShowDeleteModal(true);
  };

  // Confirm post deletion
  const confirmDeletePost = async () => {
    if (!deletePostId || deletingPost) {
      return;
    }

    setDeletingPost(true);

    try {
      await axios.delete(
        `/api/posts/${deletePostId}?userId=${session.user.id}`
      );

      // Remove deleted post from the feed
      setPosts((currentPosts) =>
        currentPosts.filter(
          (post) => post._id !== deletePostId
        )
      );

      // Close modal
      setShowDeleteModal(false);
      setDeletePostId(null);
    } catch (error) {
      console.error(
        "Error deleting post:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to delete the post. Please try again."
      );
    } finally {
      setDeletingPost(false);
    }
  };

  // Cancel delete
  const cancelDeletePost = () => {
    if (deletingPost) return;

    setShowDeleteModal(false);
    setDeletePostId(null);
  };

  // Delete comment
  const handleDeleteComment = async (
    postId,
    commentId
  ) => {
    try {
      const res = await axios.put(
        `/api/posts/${postId}`,
        {
          userId: session.user.id,
          type: "deleteComment",
          commentText: commentId,
        }
      );

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post._id === postId
            ? res.data.post
            : post
        )
      );
    } catch (error) {
      console.error(
        "Error deleting comment:",
        error
      );
    }
  };

  // Loading state
  if (status === "loading" || loading) {
    return (
      <AppShell>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className={styles.homeLayout}>
        <section className={styles.homeMain}>
          {/* Search */}
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
                <circle
                  cx="11"
                  cy="11"
                  r="8"
                />
                <line
                  x1="21"
                  y1="21"
                  x2="16.65"
                  y2="16.65"
                />
              </svg>

              <input
                type="text"
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                className={styles.searchInput}
              />
            </div>

            {users.length > 0 && (
              <div className={styles.searchResults}>
                {users.map((user) => (
                  <Link
                    key={user._id}
                    href={`/profile/${user._id}`}
                    className={
                      styles.searchResultItem
                    }
                  >
                    <div
                      className={
                        styles.searchResultAvatar
                      }
                    >
                      {user.name
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <div
                        className={
                          styles.searchResultName
                        }
                      >
                        {user.name}
                      </div>

                      <div
                        className={
                          styles.searchResultHandle
                        }
                      >
                        @{user.username}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Create Post */}
          <div className={styles.createPostCard}>
            <div
              className={
                styles.createPostHeader
              }
            >
              <Link
                href={`/profile/${session?.user?.id}`}
                className={
                  styles.createPostAvatar
                }
              >
                {session?.user
                  ?.profilePicture ? (
                  <img
                    src={
                      session.user.profilePicture
                    }
                    alt={session.user.name}
                  />
                ) : (
                  session?.user?.name
                    ?.charAt(0)
                    .toUpperCase()
                )}
              </Link>

              <form
                onSubmit={handlePost}
                className={
                  styles.createPostForm
                }
              >
                <input
                  id="postInput"
                  type="text"
                  placeholder="What’s sparking your mind?"
                  value={newPost}
                  onChange={(e) =>
                    setNewPost(e.target.value)
                  }
                  className={
                    styles.postInput
                  }
                />

                <div
                  className={
                    styles.postActions
                  }
                >
                  <div
                    className={
                      styles.postActionsLeft
                    }
                  >
                    <label
                      htmlFor="imageInput"
                      className={
                        styles.imageUploadLabel
                      }
                    >
                      <svg
                        width="22"
                        height="22"
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
                        />
                        <circle
                          cx="8.5"
                          cy="8.5"
                          r="1.5"
                        />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </label>

                    <input
                      id="imageInput"
                      type="file"
                      accept="image/*"
                      onChange={
                        handleImageSelect
                      }
                      className={
                        styles.imageInput
                      }
                    />
                  </div>

                  <button
                    type="submit"
                    className={
                      styles.postSubmit
                    }
                    disabled={
                      posting ||
                      uploadingImage ||
                      (!newPost.trim() &&
                        !selectedImage)
                    }
                  >
                    {uploadingImage
                      ? "Uploading..."
                      : posting
                        ? "Sparking..."
                        : "Spark it"}
                  </button>
                </div>
              </form>
            </div>

            {selectedImage && (
              <div
                className={
                  styles.imagePreview
                }
              >
                <img
                  src={selectedImage}
                  alt="Preview"
                />

                <button
                  type="button"
                  onClick={removeImage}
                  className={
                    styles.removeImage
                  }
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Posts Feed */}
          <div className={styles.feed}>
            {posts.length === 0 ? (
              <div
                className={
                  styles.emptyFeed
                }
              >
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

                <p>
                  No posts yet. Be the first
                  to share something!
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUserId={
                    session?.user?.id
                  }
                  onLike={handleLike}
                  onComment={handleComment}
                  onDelete={handleDelete}
                  onDeleteComment={
                    handleDeleteComment
                  }
                />
              ))
            )}
          </div>
        </section>
      </div>

      {/* =========================================
          DELETE CONFIRMATION MODAL
          ========================================= */}
      {showDeleteModal && (
        <div
          className={
            styles.deleteModalOverlay
          }
          onClick={cancelDeletePost}
          role="presentation"
        >
          <div
            className={styles.deleteModal}
            onClick={(e) =>
              e.stopPropagation()
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-post-title"
          >
            <div
              className={
                styles.deleteModalIcon
              }
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </div>

            <h2 id="delete-post-title">
              Delete post?
            </h2>

            <p>
              Are you sure you want to delete
              this post?
              <br />
              This action cannot be undone.
            </p>

            <div
              className={
                styles.deleteModalActions
              }
            >
              <button
                type="button"
                className={
                  styles.deleteCancelButton
                }
                onClick={cancelDeletePost}
                disabled={deletingPost}
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  styles.deleteConfirmButton
                }
                onClick={confirmDeletePost}
                disabled={deletingPost}
              >
                {deletingPost
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
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
const [showComments, setShowComments] =
  useState(false);

const [commentText, setCommentText] =
  useState("");

const [replyingTo, setReplyingTo] =
  useState(null);

const [mentionUsers, setMentionUsers] =
  useState([]);

const [showMentionSuggestions, setShowMentionSuggestions] =
  useState(false);

const [mentionLoading, setMentionLoading] =
  useState(false);

  const [isLiked, setIsLiked] = useState(
    post.likes?.includes(currentUserId)
  );

  const [isBookmarked, setIsBookmarked] =
    useState(false);

  const [isEditing, setIsEditing] =
    useState(false);

  const [editDesc, setEditDesc] =
    useState(post.desc || "");

  const [showReactions, setShowReactions] =
    useState(false);

  const [userReaction, setUserReaction] =
    useState(
      post.userReactions?.[
        currentUserId
      ] || null
    );

  const reactionsList = [
    {
      name: "like",
      emoji: "👍",
    },
    {
      name: "love",
      emoji: "❤️",
    },
    {
      name: "haha",
      emoji: "😂",
    },
    {
      name: "wow",
      emoji: "😮",
    },
    {
      name: "sad",
      emoji: "😢",
    },
    {
      name: "angry",
      emoji: "😡",
    },
  ];

  const getTotalReactions = () => {
    if (!post.reactions) return 0;

    const reactions = post.reactions;
    let total = 0;

    for (const key in reactions) {
      if (key.startsWith("user_")) {
        continue;
      }

      total += reactions[key] || 0;
    }

    return total;
  };

  const handleLikeClick = () => {
    setIsLiked(!isLiked);
    onLike(post._id);
  };

  const handleReaction = async (
    reactionName
  ) => {
    try {
      const res = await axios.put(
        `/api/posts/${post._id}`,
        {
          userId: currentUserId,
          type: "react",
          reaction: reactionName,
        }
      );

      const updatedPost = res.data.post;

      // Get current user's reaction
      const savedReaction =
        updatedPost.userReactions?.[
          currentUserId
        ] || null;

      setUserReaction(savedReaction);
      setShowReactions(false);
    } catch (error) {
      console.error(
        "Error adding reaction:",
        error
      );
    }
  };

  const handleBookmark = async () => {
    try {
      const res = await axios.put(
        `/api/posts/${post._id}`,
        {
          userId: currentUserId,
          type: "bookmark",
        }
      );

      setIsBookmarked(
        res.data.isBookmarked
      );
    } catch (error) {
      console.error(
        "Error bookmarking post:",
        error
      );
    }
  };

  const handleEdit = async () => {
    if (!editDesc.trim()) return;

    try {
      const res = await axios.put(
        `/api/posts/${post._id}`,
        {
          userId: currentUserId,
          type: "edit",
          newDesc: editDesc,
        }
      );

      post.desc = res.data.post.desc;
      setIsEditing(false);
    } catch (error) {
      console.error(
        "Error editing post:",
        error
      );
    }
  };

const handleCommentSubmit = async (e) => {
  e.preventDefault();

  if (!commentText.trim()) return;m

  try {
    const res = await axios.put(
      `/api/posts/${post._id}`,
      {
        type: replyingTo ? "reply" : "comment",
        commentText: commentText.trim(),
        parentCommentId:
          replyingTo?._id || null,
      }
    );

    if (res.data?.post) {
      onComment(post._id, res.data.post);
    }

    setCommentText("");
    setReplyingTo(null);
    setMentionUsers([]);
    setShowMentionSuggestions(false);
    setShowComments(true);
  } catch (error) {
    console.error(
      "Error submitting comment/reply:",
      error
    );
  }
};

const handleCommentInput = async (e) => {
  const value = e.target.value;

  setCommentText(value);

  const match = value.match(
    /@([a-zA-Z0-9_.-]*)$/
  );

  if (!match) {
    setShowMentionSuggestions(false);
    setMentionUsers([]);
    return;
  }

  const query = match[1];

  if (!query) {
    setMentionUsers([]);
    setShowMentionSuggestions(false);
    return;
  }

  try {
    setMentionLoading(true);

    const res = await axios.get(
      `/api/users?q=${encodeURIComponent(
        query
      )}`
    );

    setMentionUsers(
      res.data.users || []
    );

    setShowMentionSuggestions(
      (res.data.users || []).length > 0
    );
  } catch (error) {
    console.error(
      "Mention search error:",
      error
    );

    setMentionUsers([]);
    setShowMentionSuggestions(false);
  } finally {
    setMentionLoading(false);
  }
};

const handleReply = (comment) => {
  const username =
    comment.userId?.username;

  setReplyingTo(comment);

  setCommentText(
    username
      ? `@${username} `
      : ""
  );

  setShowComments(true);
};
  return (
    <article className={styles.postCard}>
      {/* Post Header */}
      <div className={styles.postHeader}>
        <Link
          href={`/profile/${post.userId?._id}`}
          className={styles.postAvatar}
        >
          {post.userId?.profilePicture ? (
            <img
              src={
                post.userId.profilePicture
              }
              alt={post.userId.name}
            />
          ) : (
            post.userId?.name
              ?.charAt(0)
              .toUpperCase()
          )}
        </Link>

        <div
          className={styles.postUserInfo}
        >
          <Link
            href={`/profile/${post.userId?._id}`}
            className={
              styles.postUserName
            }
          >
            {post.userId?.name}
          </Link>

          <div
            className={styles.postMeta}
          >
            <span
              className={
                styles.postUserHandle
              }
            >
              @{post.userId?.username}
            </span>

            <span
              className={styles.postTime}
            >
              •{" "}
              {new Date(
                post.createdAt
              ).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Delete Button */}
        {post.userId?._id ===
          currentUserId && (
          <button
            type="button"
            onClick={() =>
              onDelete(post._id)
            }
            className={styles.postMenu}
            aria-label="Delete post"
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

      {/* Post Content */}
      <div className={styles.postContent}>
        {isEditing ? (
          <div className={styles.editForm}>
            <textarea
              value={editDesc}
              onChange={(e) =>
                setEditDesc(e.target.value)
              }
              className={
                styles.editTextarea
              }
              rows={3}
              autoFocus
            />

            <div
              className={styles.editActions}
            >
              <button
                type="button"
                onClick={() =>
                  setIsEditing(false)
                }
                className={
                  styles.cancelBtn
                }
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleEdit}
                className={styles.saveBtn}
              >
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
                  className={
                    styles.editedLabel
                  }
                >
                  (edited)
                </span>
              )}
            </p>

            {post.img && (
              <img
                src={post.img}
                alt="Post"
                className={styles.postImage}
              />
            )}
          </>
        )}
      </div>

      {/* Post Actions */}
      <div
        className={
          styles.postCardActions
        }
      >
        {/* Reaction Button */}
        <div
          className={
            styles.reactionWrapper
          }
        >
          <button
            type="button"
            onClick={() =>
              setShowReactions(
                !showReactions
              )
            }
            className={`${styles.actionBtn} ${
              userReaction
                ? styles.liked
                : ""
            }`}
          >
            <span>
              {userReaction
                ? reactionsList.find(
                    (r) =>
                      r.name ===
                      userReaction
                  )?.emoji
                : "⚡"}
            </span>

            <span>
              {getTotalReactions() ||
                post.likes?.length ||
                0}
            </span>
          </button>

          {showReactions && (
            <div
              className={
                styles.reactionsPopup
              }
            >
              {reactionsList.map(
                (reaction) => (
                  <button
                    type="button"
                    key={reaction.name}
                    onClick={() =>
                      handleReaction(
                        reaction.name
                      )
                    }
                    className={
                      styles.reactionOption
                    }
                  >
                    {reaction.emoji}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Comments */}
        <button
          type="button"
          onClick={() =>
            setShowComments(
              !showComments
            )
          }
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

          <span>
            {post.comments?.length ||
              0}
          </span>
        </button>

        {/* Bookmark */}
        <button
          type="button"
          onClick={handleBookmark}
          className={`${styles.actionBtn} ${
            isBookmarked
              ? styles.liked
              : ""
          }`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={
              isBookmarked
                ? "currentColor"
                : "none"
            }
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>

      {/* Comments Section */}
    {showComments && (
  <div className={styles.commentsSection}>

    {/* Replying indicator */}
    {replyingTo && (
      <div className={styles.replyingIndicator}>
        <span>
          Replying to{" "}
          <strong>
            @{replyingTo.userId?.username}
          </strong>
        </span>

        <button
          type="button"
          onClick={() => {
            setReplyingTo(null);
            setCommentText("");
          }}
        >
          Cancel
        </button>
      </div>
    )}

    {/* Comments */}
    <div className={styles.commentsList}>
      {post.comments
        ?.filter(
          (comment) =>
            !comment.parentCommentId
        )
        .map((comment) => (
          <CommentItem
            key={comment._id}
            comment={comment}
            allComments={
              post.comments || []
            }
            currentUserId={
              currentUserId
            }
            postId={post._id}
            onReply={handleReply}
            onDeleteComment={
              onDeleteComment
            }
          />
        ))}
    </div>

    {/* Mention dropdown */}
    <div className={styles.commentInputWrapper}>

      {showMentionSuggestions &&
        mentionUsers.length > 0 && (
          <div
            className={
              styles.mentionSuggestions
            }
          >
            {mentionUsers.map(
              (user) => (
                <button
                  key={user._id}
                  type="button"
                  className={
                    styles.mentionSuggestion
                  }
                  onClick={() => {
                    const updatedText =
                      commentText.replace(
                        /@[a-zA-Z0-9_.-]*$/,
                        `@${user.username} `
                      );

                    setCommentText(
                      updatedText
                    );

                    setShowMentionSuggestions(
                      false
                    );

                    setMentionUsers([]);
                  }}
                >
                  <div
                    className={
                      styles.mentionAvatar
                    }
                  >
                    {user.profilePicture ? (
                      <img
                        src={
                          user.profilePicture
                        }
                        alt={
                          user.name
                        }
                      />
                    ) : (
                      (
                        user.name ||
                        "U"
                      )
                        .charAt(0)
                        .toUpperCase()
                    )}
                  </div>

                  <div
                    className={
                      styles.mentionUserInfo
                    }
                  >
                    <strong>
                      {user.name}
                    </strong>

                    <span>
                      @{user.username}
                    </span>
                  </div>
                </button>
              )
            )}
          </div>
        )}

      <form
        onSubmit={
          handleCommentSubmit
        }
        className={
          styles.commentForm
        }
      >
        <input
          type="text"
          placeholder={
            replyingTo
              ? `Reply to @${
                  replyingTo
                    .userId
                    ?.username ||
                  ""
                }`
              : "Write a comment..."
          }
          value={commentText}
          onChange={
            handleCommentInput
          }
          className={
            styles.commentInput
          }
        />

        <button
          type="submit"
          className={
            styles.commentSubmit
          }
          disabled={
            !commentText.trim()
          }
        >
          {replyingTo
            ? "Reply"
            : "Comment"}
        </button>
      </form>
    </div>
  </div>
)}
    </article>
  );
}

function CommentItem({
  comment,
  allComments,
  currentUserId,
  postId,
  onReply,
  onDeleteComment,
}) {
  const replies =
    allComments.filter(
      (item) =>
        item.parentCommentId?.toString() ===
        comment._id?.toString()
    );

  return (
    <div
      className={
        styles.commentWrapper
      }
    >
      <div
        className={
          styles.comment
        }
      >

        {/* Avatar */}
        <Link
          href={`/profile/${comment.userId?._id}`}
          className={
            styles.commentAvatar
          }
        >
          {comment.userId
            ?.profilePicture ? (
            <img
              src={
                comment.userId
                  .profilePicture
              }
              alt={
                comment.userId
                  .name ||
                "User"
              }
            />
          ) : (
            (
              comment.userId
                ?.name ||
              "U"
            )
              .charAt(0)
              .toUpperCase()
          )}
        </Link>

        {/* Content */}
        <div
          className={
            styles.commentContent
          }
        >
          <Link
            href={`/profile/${comment.userId?._id}`}
            className={
              styles.commentUserName
            }
          >
            {comment.userId?.name ||
              "User"}
          </Link>

          <CommentText
            text={comment.text}
            mentions={
              comment.mentions || []
            }
          />

          {/* Actions */}
          <div
            className={
              styles.commentActions
            }
          >
            <button
              type="button"
              className={
                styles.commentReplyBtn
              }
              onClick={() =>
                onReply(comment)
              }
            >
              Reply
            </button>

            {comment.userId?._id ===
              currentUserId && (
              <button
                type="button"
                className={
                  styles.commentDeleteBtn
                }
                onClick={() =>
                  onDeleteComment(
                    postId,
                    comment._id
                  )
                }
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {replies.length > 0 && (
        <div
          className={
            styles.commentReplies
          }
        >
          {replies.map(
            (reply) => (
              <CommentItem
                key={
                  reply._id
                }
                comment={
                  reply
                }
                allComments={
                  allComments
                }
                currentUserId={
                  currentUserId
                }
                postId={
                  postId
                }
                onReply={
                  onReply
                }
                onDeleteComment={
                  onDeleteComment
                }
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function CommentText({
  text,
  mentions = [],
}) {
  const parts = text.split(
    /(@[a-zA-Z0-9_.-]+)/g
  );

  return (
    <p
      className={
        styles.commentText
      }
    >
      {parts.map(
        (part, index) => {
          if (
            part.startsWith("@")
          ) {
            const username =
              part.slice(1);

            const mentionedUser =
              mentions.find(
                (user) =>
                  user.username?.toLowerCase() ===
                  username.toLowerCase()
              );

            if (
              mentionedUser
            ) {
              return (
                <Link
                  key={index}
                  href={`/profile/${mentionedUser._id}`}
                  className={
                    styles.commentMention
                  }
                >
                  {part}
                </Link>
              );
            }
          }

          return (
            <span
              key={index}
            >
              {part}
            </span>
          );
        }
      )}
    </p>
  );
}