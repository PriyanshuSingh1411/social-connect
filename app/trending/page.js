"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useTheme } from "@/components/ThemeProvider";
import styles from "./trending.module.css";

export default function TrendingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [hashtags, setHashtags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchTrendingHashtags();
      fetchUnreadCount();
    }
  }, [session]);

  const fetchTrendingHashtags = async () => {
    try {
      const res = await axios.get("/api/hashtags/trending?limit=20");
      setHashtags(res.data.hashtags || []);
    } catch (error) {
      console.error("Error fetching trending hashtags:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get(
        `/api/notifications?userId=${session.user.id}`,
      );
      setUnreadCount(res.data.unreadCount || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

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

  const searchUsers = async () => {
    try {
      const res = await axios.get(`/api/users?q=${searchQuery}`);
      setUsers(res.data.users);
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  const navItems = [
    {
      href: "/home",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      label: "Home",
      active: pathname === "/home",
    },
    {
      href: "/explore",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      ),
      label: "Explore",
      active: pathname === "/explore",
    },
    {
      href: "/chat",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      label: "Chat",
      active: pathname === "/chat",
    },
    {
      href: "/notifications",
      icon: (
        <div style={{ position: "relative" }}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 8A6 6 0 0 0 6 7-3 8c0 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-6px",
                right: "-8px",
                backgroundColor: "#ef4444",
                color: "white",
                borderRadius: "10px",
                padding: "1px 5px",
                fontSize: "10px",
                fontWeight: "bold",
                minWidth: "16px",
                textAlign: "center",
                border: "2px solid white",
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      ),
      label: "Alerts",
      active: pathname === "/notifications",
    },
    {
      href: `/profile/${session?.user?.id}`,
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      label: "Profile",
      active: pathname?.startsWith("/profile"),
    },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/home" className={styles.logo}>
            <svg
              width="32"
              height="32"
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
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${item.active ? styles.active : ""}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className={styles.searchContainer}>
            <div className={styles.searchBox}>
              <svg
                width="16"
                height="16"
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
                placeholder="Search..."
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
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={toggleTheme}
              className={styles.themeToggle}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--background-tertiary)",
                border: "1px solid var(--border)",
                cursor: "pointer",
              }}
              title={
                theme === "dark"
                  ? "Switch to Light Mode"
                  : "Switch to Dark Mode"
              }
            >
              {theme === "dark" ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            <Link
              href={`/profile/${session?.user?.id}`}
              className={styles.userAvatar}
            >
              {session?.user?.profilePicture ? (
                <img
                  src={session.user.profilePicture}
                  alt={session.user.name}
                />
              ) : (
                session?.user?.name?.charAt(0).toUpperCase()
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.trendingHeader}>
          <h1>📈 Trending Hashtags</h1>
          <p>Discover what's trending in your community</p>
        </div>

        {hashtags.length === 0 ? (
          <div className={styles.emptyState}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M4 4h16v16H4z" />
              <path d="M4 10h16" />
              <path d="M10 4v16" />
            </svg>
            <h2>No trending hashtags yet</h2>
            <p>Hashtags from posts will appear here when they become popular</p>
          </div>
        ) : (
          <div className={styles.hashtagsGrid}>
            {hashtags.map((item, index) => (
              <Link
                key={item.tag}
                href={`/hashtag/${item.tag}`}
                className={styles.hashtagCard}
              >
                <div className={styles.hashtagRank}>#{index + 1}</div>
                <div className={styles.hashtagInfo}>
                  <h3>#{item.tag}</h3>
                  <span className={styles.hashtagCount}>
                    {item.count} {item.count === 1 ? "post" : "posts"}
                  </span>
                </div>
                <div className={styles.hashtagTrend}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className={styles.suggestions}>
          <h2>💡 Tips</h2>
          <ul>
            <li>Use hashtags in your posts to reach more people</li>
            <li>Add up to 10 hashtags per post</li>
            <li>Use relevant and popular hashtags</li>
          </ul>
        </div>
      </main>

      <nav className={styles.bottomNav}>
        <div className={styles.bottomNavContent}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.bottomNavItem} ${item.active ? styles.active : ""}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
