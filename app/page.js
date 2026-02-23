"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <div className={styles.logo}>
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
        </div>
        <div className={styles.navLinks}>
          <Link href="/login" className={styles.loginBtn}>
            Log In
          </Link>
          <Link href="/signup" className={styles.signupBtn}>
            Sign Up
          </Link>
        </div>
      </nav>

      <main className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            Connect with friends and share your moments
          </h1>
          <p className={styles.subtitle}>
            Join SocialConnect to stay connected with friends, share photos and
            videos, and discover new content from around the world.
          </p>
          <div className={styles.cta}>
            <Link href="/signup" className={styles.ctaPrimary}>
              Get Started
            </Link>
            <button
              onClick={() => router.push("/login")}
              className={styles.ctaSecondary}
            >
              Learn More
            </button>
          </div>
        </div>

        <div className={styles.features}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3>Connect with Friends</h3>
            <p>Follow your friends and see their posts in your feed</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <h3>Share Moments</h3>
            <p>Share photos, videos, and thoughts with your followers</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <h3>Stay Updated</h3>
            <p>Get notifications about likes, comments, and new followers</p>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2024 SocialConnect. All rights reserved.</p>
      </footer>
    </div>
  );
}
