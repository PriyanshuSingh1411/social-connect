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
      {/* Animated Background */}
      <div className={styles.backgroundPattern}>
        <div className={styles.blob1}></div>
        <div className={styles.blob2}></div>
        <div className={styles.blob3}></div>
        <div className={styles.gridOverlay}></div>
      </div>

      {/* Navigation */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </div>
          <span className={styles.logoText}>Spark</span>
        </div>
        <div className={styles.navLinks}>
          <Link href="/login" className={styles.loginBtn}>
            Log In
          </Link>
          <Link href="/signup" className={styles.signupBtn}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            Share your <span className={styles.titleAccent}>spark</span> with
            the world
          </h1>
          <p className={styles.subtitle}>
            Connect authentically, share moments that matter, and discover a
            community that celebrates real connections. Your voice deserves a
            platform that feels like home.
          </p>
          <div className={styles.cta}>
            <Link href="/signup" className={styles.ctaPrimary}>
              Join the Community
            </Link>
            <button
              onClick={() => router.push("/login")}
              className={styles.ctaSecondary}
            >
              Explore Features
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>10K+</div>
            <div className={styles.statLabel}>Active Members</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>50K+</div>
            <div className={styles.statLabel}>Posts Shared</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>1M+</div>
            <div className={styles.statLabel}>Connections Made</div>
          </div>
        </div>

        {/* Features */}
        <div className={styles.features}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg
                width="28"
                height="28"
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
            <h3>Authentic Connections</h3>
            <p>
              Build meaningful relationships with people who share your
              interests and values
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg
                width="28"
                height="28"
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
            <h3>Share Your Story</h3>
            <p>
              Express yourself through posts, photos, and videos that capture
              your unique perspective
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <h3>Stay Informed</h3>
            <p>
              Get real-time notifications about interactions and updates from
              your network
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2024 Spark. All rights reserved.</p>
      </footer>
    </div>
  );
}
