"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import styles from "./edit-profile.module.css";

export default function EditProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    bio: "",
    location: "",
    profilePicture: "",
    coverPicture: "",
    isPrivate: false,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUser();
    }
  }, [session]);

  const fetchUser = async () => {
    try {
      const res = await axios.get(`/api/users/${session.user.id}`);
      setUser(res.data.user);
      setFormData({
        name: res.data.user.name || "",
        username: res.data.user.username || "",
        email: res.data.user.email || "",
        bio: res.data.user.bio || "",
        location: res.data.user.location || "",
        profilePicture: res.data.user.profilePicture || "",
        coverPicture: res.data.user.coverPicture || "",
        isPrivate: res.data.user.isPrivate || false,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess(false);
  };

  const handleTogglePrivate = () => {
    setFormData({ ...formData, isPrivate: !formData.isPrivate });
    setError("");
    setSuccess(false);
  };

  const handleImageSelect = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, [field]: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await axios.put(`/api/users/${session.user.id}`, {
        ...formData,
        type: "update",
        currentUserId: session.user.id,
      });
      setUser(res.data.user);
      setSuccess(true);

      // Update session with new user data
      await update({
        ...session,
        user: {
          ...session.user,
          name: formData.name,
          username: formData.username,
          profilePicture: formData.profilePicture,
        },
      });

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loadingUser) {
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
        <button onClick={() => router.back()} className={styles.backButton}>
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
        </button>
        <h1>Edit Profile</h1>
        <button
          type="submit"
          form="editForm"
          className={styles.saveBtn}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </header>

      {/* Cover Photo */}
      <div className={styles.coverSection}>
        <div className={styles.coverPhoto}>
          {formData.coverPicture ? (
            <img src={formData.coverPicture} alt="Cover" />
          ) : (
            <div className={styles.coverPlaceholder}></div>
          )}
          <label htmlFor="coverInput" className={styles.coverEditBtn}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </label>
          <input
            id="coverInput"
            type="file"
            accept="image/*"
            onChange={(e) => handleImageSelect(e, "coverPicture")}
            className={styles.hiddenInput}
          />
        </div>

        {/* Profile Picture */}
        <div className={styles.profilePictureSection}>
          <div className={styles.profilePicture}>
            {formData.profilePicture ? (
              <img src={formData.profilePicture} alt="Profile" />
            ) : (
              <span>{formData.name?.charAt(0).toUpperCase()}</span>
            )}
            <label htmlFor="profileInput" className={styles.profileEditBtn}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </label>
            <input
              id="profileInput"
              type="file"
              accept="image/*"
              onChange={(e) => handleImageSelect(e, "profilePicture")}
              className={styles.hiddenInput}
            />
          </div>
        </div>
      </div>

      {/* Form */}
      <form id="editForm" onSubmit={handleSubmit} className={styles.form}>
        {success && (
          <div className={styles.successMessage}>
            Profile updated successfully!
          </div>
        )}

        {error && <div className={styles.errorMessage}>{error}</div>}

        <div className={styles.inputGroup}>
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
            required
            className={styles.input}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter your username"
            required
            className={styles.input}
          />
          <span className={styles.hint}>
            https://socialconnect.com/{formData.username}
          </span>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
            className={styles.input}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell us about yourself"
            rows={3}
            maxLength={200}
            className={styles.textarea}
          />
          <span className={styles.charCount}>
            {formData.bio?.length || 0}/200
          </span>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Enter your location"
            className={styles.input}
          />
        </div>

        {/* Private Account Toggle */}
        <div className={styles.privacySection}>
          <div className={styles.privacyInfo}>
            <label className={styles.privacyLabel}>Private Account</label>
            <span className={styles.privacyDescription}>
              {formData.isPrivate
                ? "Only your approved followers can see your posts"
                : "Anyone can see your posts"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleTogglePrivate}
            className={`${styles.toggleButton} ${
              formData.isPrivate ? styles.toggleOn : styles.toggleOff
            }`}
          >
            <span className={styles.toggleSlider}></span>
          </button>
        </div>

        <div className={styles.statsSection}>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {user?.followers?.length || 0}
            </span>
            <span className={styles.statLabel}>Followers</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {user?.following?.length || 0}
            </span>
            <span className={styles.statLabel}>Following</span>
          </div>
        </div>
      </form>
    </div>
  );
}
