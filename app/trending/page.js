"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import AppShell from "@/components/AppShell";
import styles from "./trending.module.css";

export default function TrendingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hashtags, setHashtags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchTrendingHashtags();
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
              placeholder="Search people..."
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

        <div className={styles.trendingHeader}>
          <h1>Trending Hashtags</h1>
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
              <button
                key={item.tag}
                type="button"
                onClick={() => setSearchQuery(item.tag)}
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
              </button>
            ))}
          </div>
        )}

        <div className={styles.suggestions}>
          <h2>Tips</h2>
          <ul>
            <li>Use hashtags in your posts to reach more people</li>
            <li>Add up to 10 hashtags per post</li>
            <li>Use relevant and popular hashtags</li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
