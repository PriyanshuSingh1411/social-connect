"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useTheme } from "./ThemeProvider";
import styles from "./AppShell.module.css";

function useUnreadCount(sessionUserId) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!sessionUserId) return;

    try {
      const res = await axios.get("/api/notifications");
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      // Silent: an unread badge failing to update isn't worth
      // surfacing an error for, and the next poll will retry.
    }
  }, [sessionUserId]);

  useEffect(() => {
    if (!sessionUserId) return;

    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 60_000);

    return () => clearInterval(interval);
  }, [sessionUserId, fetchUnreadCount]);

  return unreadCount;
}

const NAV_ITEMS = [
  {
    href: "/home",
    label: "Home",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/explore",
    label: "Explore",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    href: "/trending",
    label: "Trending",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  {
    href: "/stories",
    label: "Stories",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="12" r="9" />
        <path d="M9 8v8l6-4z" />
      </svg>
    ),
  },
  {
    href: "/chat",
    label: "Chat",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: "/notifications",
    label: "Alerts",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    hasBadge: true,
  },
];

/**
 * Shared authenticated-area shell: top nav bar, theme toggle, and a
 * presence indicator. Every authenticated page wraps its content in
 * this instead of implementing its own nav — closes the gap where
 * explore, notifications, stories, profile, and edit-profile
 * previously had no way to reach the rest of the app.
 */
export default function AppShell({ children, fullWidth = false }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const unreadCount = useUnreadCount(session?.user?.id);

  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <Link href="/home" className={styles.logo}>
          <span className={styles.logoMark} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="2.5" />
              <circle cx="6" cy="12" r="2.5" />
              <circle cx="18" cy="19" r="2.5" />
              <line x1="8.3" y1="13.4" x2="15.7" y2="17.6" />
              <line x1="15.7" y1="6.4" x2="8.3" y2="10.6" />
            </svg>
          </span>
          Spark
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {item.icon}
                <span className={styles.navLabel}>{item.label}</span>
                {item.hasBadge && unreadCount > 0 && (
                  <span className={styles.navBadge} aria-label={`${unreadCount} unread`}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className={styles.topBarActions}>
          <button
            onClick={toggleTheme}
            className={styles.iconButton}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="12" r="4.5" />
                <line x1="12" y1="2" x2="12" y2="4.5" />
                <line x1="12" y1="19.5" x2="12" y2="22" />
                <line x1="4.2" y1="4.2" x2="6" y2="6" />
                <line x1="18" y1="18" x2="19.8" y2="19.8" />
                <line x1="2" y1="12" x2="4.5" y2="12" />
                <line x1="19.5" y1="12" x2="22" y2="12" />
                <line x1="4.2" y1="19.8" x2="6" y2="18" />
                <line x1="18" y1="6" x2="19.8" y2="4.2" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
              </svg>
            )}
          </button>

          <Link
            href={`/profile/${session?.user?.id || ""}`}
            className={styles.profileLink}
            aria-label="Your profile"
          >
            <span className={styles.avatar}>
              {session?.user?.profilePicture ? (
                <img src={session.user.profilePicture} alt="" />
              ) : (
                session?.user?.name?.charAt(0)?.toUpperCase() || "?"
              )}
            </span>
            {/* Presence dot: the signature element. This is a platform
                for people who already know each other, so a quiet
                "you're here" marker fits better than a decorative
                flourish would. */}
            <span className={styles.presenceDot} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main className={`${styles.content} ${fullWidth ? styles.contentFullWidth : ""}`}>
        {children}
      </main>
    </div>
  );
}
