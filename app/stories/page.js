"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import AppShell from "@/components/AppShell";
import styles from "./stories.module.css";

export default function StoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [selectedUserStories, setSelectedUserStories] = useState(null);
  const [newStory, setNewStory] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Viewer list (own stories only)
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);

  // Comment / private reply (others' stories only)
  const [replyText, setReplyText] = useState("");
  const [replyMode, setReplyMode] = useState("public"); // "public" | "private"
  const [comments, setComments] = useState([]);
  const [sending, setSending] = useState(false);
  const [sentConfirmation, setSentConfirmation] = useState("");
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchStories();
    }
  }, [session]);

  const fetchStories = async () => {
    try {
      const res = await axios.get("/api/stories");
      setStories(res.data.stories);
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const createStory = async () => {
    if (!selectedImage) return;

    try {
      await axios.post("/api/stories", {
        media: selectedImage,
        mediaType: "image",
      });
      setShowCreateModal(false);
      setSelectedImage(null);
      fetchStories();
    } catch (error) {
      console.error("Error creating story:", error);
    }
  };

  const isOwnStory =
    selectedUserStories?.user?._id === session?.user?.id;

  const openStory = (userStories) => {
    setSelectedUserStories(userStories);
    setCurrentStoryIndex(0);
    setSelectedStory(userStories.stories[0]);
  };

  // Whenever the open story changes (including navigating next/prev),
  // reset per-story UI state and fetch that story's own comments —
  // carrying stale comments or an open confirmation across to a
  // different story would be confusing.
  useEffect(() => {
    if (!selectedStory) return;
    setComments([]);
    setShowDeleteConfirm(false);
    setShowViewers(false);
    setReplyText("");
    setSentConfirmation("");

    const loadStory = async () => {
      try {
        const res = await axios.get(`/api/stories/${selectedStory._id}`);
        setComments(res.data.story.comments || []);
        if (!res.data.isOwner) {
          // Fire-and-forget: recording a view isn't something the
          // viewer needs to wait on or see the result of.
          axios
            .put(`/api/stories/${selectedStory._id}`, { type: "view" })
            .catch(() => {});
        }
      } catch (error) {
        console.error("Error loading story details:", error);
      }
    };
    loadStory();
  }, [selectedStory?._id]);

  const nextStory = () => {
    if (currentStoryIndex < selectedUserStories.stories.length - 1) {
      const newIndex = currentStoryIndex + 1;
      setCurrentStoryIndex(newIndex);
      setSelectedStory(selectedUserStories.stories[newIndex]);
    } else {
      // Move to next user's stories
      const currentUserIndex = stories.findIndex(
        (s) => s.user._id === selectedUserStories.user._id,
      );
      if (currentUserIndex < stories.length - 1) {
        const nextUserStories = stories[currentUserIndex + 1];
        setSelectedUserStories(nextUserStories);
        setCurrentStoryIndex(0);
        setSelectedStory(nextUserStories.stories[0]);
      } else {
        closeStory();
      }
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      const newIndex = currentStoryIndex - 1;
      setCurrentStoryIndex(newIndex);
      setSelectedStory(selectedUserStories.stories[newIndex]);
    } else {
      // Move to previous user's stories
      const currentUserIndex = stories.findIndex(
        (s) => s.user._id === selectedUserStories.user._id,
      );
      if (currentUserIndex > 0) {
        const prevUserStories = stories[currentUserIndex - 1];
        setSelectedUserStories(prevUserStories);
        setCurrentStoryIndex(prevUserStories.stories.length - 1);
        setSelectedStory(
          prevUserStories.stories[prevUserStories.stories.length - 1],
        );
      }
    }
  };

  const closeStory = () => {
    setSelectedStory(null);
    setSelectedUserStories(null);
    setCurrentStoryIndex(0);
  };

  const handleDeleteStory = async () => {
    setDeleting(true);
    try {
      await axios.delete(`/api/stories/${selectedStory._id}`);
      // Remove the deleted story from local state without a full
      // refetch. If it was the only story this user had, drop their
      // whole group from the bar; otherwise just remove that one.
      setStories((prev) =>
        prev
          .map((group) =>
            group.user._id === selectedUserStories.user._id
              ? {
                  ...group,
                  stories: group.stories.filter(
                    (s) => s._id !== selectedStory._id,
                  ),
                }
              : group,
          )
          .filter((group) => group.stories.length > 0),
      );
      closeStory();
    } catch (error) {
      console.error("Error deleting story:", error);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleShowViewers = async () => {
    setShowViewers(true);
    setLoadingViewers(true);
    setIsPaused(true);
    try {
      const res = await axios.get(`/api/stories/${selectedStory._id}`);
      setViewers(res.data.story.views || []);
    } catch (error) {
      console.error("Error fetching viewers:", error);
    } finally {
      setLoadingViewers(false);
    }
  };

  const closeViewers = () => {
    setShowViewers(false);
    setIsPaused(false);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || sending) return;
    setSending(true);
    try {
      const res = await axios.put(`/api/stories/${selectedStory._id}`, {
        type: replyMode === "public" ? "comment" : "reply",
        text: replyText.trim(),
      });
      if (replyMode === "public") {
        setComments(res.data.comments || []);
      }
      setSentConfirmation(
        replyMode === "public" ? "Comment posted" : "Reply sent",
      );
      setReplyText("");
      setTimeout(() => setSentConfirmation(""), 2000);
    } catch (error) {
      console.error("Error sending reply:", error);
    } finally {
      setSending(false);
    }
  };

  // Auto-advance stories
  useEffect(() => {
    if (selectedStory && !isPaused) {
      const timer = setTimeout(() => {
        nextStory();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [selectedStory, currentStoryIndex, isPaused]);

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
      <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Stories</h1>
        <button
          className={styles.addButton}
          onClick={() => setShowCreateModal(true)}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Stories Grid */}
      <div className={styles.storiesContainer}>
        {/* My Story */}
        <div
          className={styles.storyCircle}
          onClick={() => document.getElementById("storyInput")?.click()}
        >
          <div className={styles.storyRing}>
            <div className={styles.storyAvatar}>
              {session?.user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className={styles.addIcon}>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
          </div>
          <span>Your Story</span>
        </div>

        <input
          id="storyInput"
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className={styles.storyInput}
        />

        {/* Other Users' Stories */}
        {stories.map((storyGroup) => (
          <div
            key={storyGroup.user._id}
            className={styles.storyCircle}
            onClick={() => openStory(storyGroup)}
          >
            <div className={`${styles.storyRing} ${styles.viewed}`}>
              <div className={styles.storyAvatar}>
                {storyGroup.user.profilePicture ? (
                  <img
                    src={storyGroup.user.profilePicture}
                    alt={storyGroup.user.name}
                  />
                ) : (
                  storyGroup.user.name?.charAt(0).toUpperCase()
                )}
              </div>
            </div>
            <span>{storyGroup.user.username}</span>
          </div>
        ))}
      </div>

      {/* Create Story Modal */}
      {showCreateModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Create Story</h2>
              <button
                className={styles.closeModal}
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedImage(null);
                }}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              {selectedImage ? (
                <div className={styles.imagePreview}>
                  <img src={selectedImage} alt="Preview" />
                  <button
                    className={styles.removeImage}
                    onClick={() => setSelectedImage(null)}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label htmlFor="storyImage" className={styles.uploadArea}>
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>Select an image</span>
                </label>
              )}
              <input
                id="storyImage"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className={styles.storyInput}
              />
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedImage(null);
                }}
              >
                Cancel
              </button>
              <button
                className={styles.shareBtn}
                onClick={createStory}
                disabled={!selectedImage}
              >
                Share to Story
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story Viewer Modal */}
      {selectedStory && (
        <div className={styles.storyViewer}>
          <div className={styles.storyViewerContent}>
            <div className={styles.storyProgressBar}>
              {selectedUserStories.stories.map((_, index) => (
                <div
                  key={index}
                  className={`${styles.progressSegment} ${
                    index <= currentStoryIndex ? styles.active : ""
                  }`}
                />
              ))}
            </div>
            <div className={styles.storyHeader}>
              <div className={styles.storyUser}>
                <div className={styles.storyUserAvatar}>
                  {selectedUserStories.user.profilePicture ? (
                    <img
                      src={selectedUserStories.user.profilePicture}
                      alt={selectedUserStories.user.name}
                    />
                  ) : (
                    selectedUserStories.user.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <span className={styles.storyUserName}>
                  {selectedUserStories.user.username}
                </span>
                <span className={styles.storyTime}>
                  {new Date(selectedStory.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className={styles.storyHeaderActions}>
                {isOwnStory && (
                  <button
                    className={styles.deleteStoryBtn}
                    onClick={() => {
                      setIsPaused(true);
                      setShowDeleteConfirm(true);
                    }}
                    aria-label="Delete story"
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
                <button className={styles.closeStory} onClick={closeStory}>
                  ×
                </button>
              </div>
            </div>
            <img
              src={selectedStory.media}
              alt="Story"
              className={styles.storyImage}
            />
            <div className={styles.storyNavigation}>
              <div className={styles.navArea} onClick={prevStory} />
              <div className={styles.navArea} onClick={nextStory} />
            </div>

            {/* Footer: owner sees who viewed; everyone else can
                comment publicly or reply privately */}
            <div className={styles.storyFooter}>
              {isOwnStory ? (
                <button
                  className={styles.viewersBtn}
                  onClick={handleShowViewers}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>
                    {selectedStory.views?.length || 0} viewed
                  </span>
                </button>
              ) : (
                <div className={styles.replyBar}>
                  <div className={styles.replyModeToggle}>
                    <button
                      className={`${styles.replyModeBtn} ${
                        replyMode === "public" ? styles.replyModeActive : ""
                      }`}
                      onClick={() => setReplyMode("public")}
                    >
                      Comment
                    </button>
                    <button
                      className={`${styles.replyModeBtn} ${
                        replyMode === "private" ? styles.replyModeActive : ""
                      }`}
                      onClick={() => setReplyMode("private")}
                    >
                      Reply privately
                    </button>
                  </div>
                  <div className={styles.replyInputRow}>
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onFocus={() => setIsPaused(true)}
                      onBlur={() => setIsPaused(false)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendReply();
                      }}
                      placeholder={
                        replyMode === "public"
                          ? "Comment publicly..."
                          : "Reply privately..."
                      }
                      maxLength={replyMode === "public" ? 500 : 1000}
                      className={styles.replyInput}
                    />
                    <button
                      className={styles.replySendBtn}
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || sending}
                    >
                      Send
                    </button>
                  </div>
                  {sentConfirmation && (
                    <span className={styles.sentConfirmation}>
                      {sentConfirmation}
                    </span>
                  )}
                  {replyMode === "public" && comments.length > 0 && (
                    <div className={styles.commentsPreview}>
                      {comments.slice(-2).map((c, i) => (
                        <div key={i} className={styles.commentPreviewItem}>
                          <strong>{c.userId?.username}</strong> {c.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Delete story?</h2>
            </div>
            <div className={styles.confirmBody}>
              <p>This can't be undone.</p>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setIsPaused(false);
                }}
              >
                Cancel
              </button>
              <button
                className={styles.deleteConfirmBtn}
                onClick={handleDeleteStory}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Viewer list (own stories only) */}
      {showViewers && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Viewed by</h2>
              <button className={styles.closeModal} onClick={closeViewers}>
                ×
              </button>
            </div>
            <div className={styles.viewersList}>
              {loadingViewers ? (
                <div className={styles.spinner}></div>
              ) : viewers.length === 0 ? (
                <p className={styles.noViewers}>No views yet</p>
              ) : (
                viewers.map((viewer) => (
                  <Link
                    key={viewer._id}
                    href={`/profile/${viewer._id}`}
                    className={styles.viewerItem}
                  >
                    <div className={styles.viewerAvatar}>
                      {viewer.profilePicture ? (
                        <img src={viewer.profilePicture} alt={viewer.name} />
                      ) : (
                        viewer.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className={styles.viewerName}>{viewer.name}</div>
                      <div className={styles.viewerHandle}>
                        @{viewer.username}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </AppShell>
  );
}
