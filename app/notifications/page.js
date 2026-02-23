"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import styles from "./notifications.module.css";

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications();
    }
  }, [session]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(
        `/api/notifications?userId=${session.user.id}`,
      );
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);

      // Mark as read
      await axios.put("/api/notifications", { userId: session.user.id });
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "like":
        return (
          <div className={`${styles.icon} ${styles.likeIcon}`}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="none"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
        );
      case "comment":
        return (
          <div className={`${styles.icon} ${styles.commentIcon}`}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="none"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
        );
      case "follow":
        return (
          <div className={`${styles.icon} ${styles.followIcon}`}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="none"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line
                x1="20"
                y1="8"
                x2="20"
                y2="14"
                stroke="currentColor"
                strokeWidth="2"
              />
              <line
                x1="23"
                y1="11"
                x2="17"
                y2="11"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className={styles.icon}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
        );
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
        <h1>Notifications</h1>
      </header>

      {/* Notifications List */}
      <div className={styles.notificationsList}>
        {notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <p>No notifications yet</p>
            <span>When someone interacts with you, you'll see it here</span>
          </div>
        ) : (
          notifications.map((notification) => (
            <Link
              key={notification._id}
              href={
                notification.post
                  ? `/post/${notification.post._id}`
                  : `/profile/${notification.sender._id}`
              }
              className={`${styles.notification} ${!notification.read ? styles.unread : ""}`}
            >
              {getNotificationIcon(notification.type)}

              <div className={styles.notificationContent}>
                <div className={styles.notificationAvatar}>
                  {notification.sender?.name?.charAt(0).toUpperCase()}
                </div>
                <div className={styles.notificationText}>
                  <p>
                    <strong>{notification.sender?.name}</strong>{" "}
                    {notification.message}
                  </p>
                  <span className={styles.time}>
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
