"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import AppShell from "@/components/AppShell";
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
      // email and username are deliberately excluded here: the server
      // route doesn't persist them (changing either needs its own
      // uniqueness check, and email additionally implies
      // re-verification, neither of which exists yet), so sending them
      // would let this form claim success on a field it silently
      // didn't save. The two fields are disabled in the form below for
      // the same reason.
      const { name, bio, location, profilePicture,isPrivate } =
        formData;
     const res = await axios.put(`/api/users/${session.user.id}`, {
  name,
  bio,
  location,
  profilePicture,
  isPrivate,
  type: "update",
});
      setUser(res.data.user);
      setSuccess(true);

      // Update session with new user data
      await update({
        ...session,
        user: {
          ...session.user,
          name: formData.name,
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
        <h1 className={styles.pageTitle}>Edit Profile</h1>
        <button
  type="button"
  onClick={handleSubmit}
  className={styles.saveBtn}
  disabled={loading}
>
  {loading ? "Saving..." : "Save"}
</button>
      </div>

      {/* Form */}
      <form id="editForm" onSubmit={handleSubmit} method="post" className={styles.form}>
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
            disabled
            className={styles.input}
          />
          <span className={styles.hint}>
            Changing your username isn't available yet
          </span>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            disabled
            className={styles.input}
          />
          <span className={styles.hint}>
            Changing your email isn't available yet
          </span>
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
    </AppShell>
  );
}
