"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
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
      const res = await axios.get(`/api/stories?userId=${session.user.id}`);
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
        userId: session.user.id,
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

  const openStory = (userStories) => {
    setSelectedUserStories(userStories);
    setCurrentStoryIndex(0);
    setSelectedStory(userStories.stories[0]);
  };

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

  // Auto-advance stories
  useEffect(() => {
    if (selectedStory) {
      const timer = setTimeout(() => {
        nextStory();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [selectedStory, currentStoryIndex]);

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
        <h1>Stories</h1>
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
      </header>

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
              <button className={styles.closeStory} onClick={closeStory}>
                ×
              </button>
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
          </div>
        </div>
      )}
    </div>
  );
}
