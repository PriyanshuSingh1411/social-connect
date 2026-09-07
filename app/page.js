"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();
  const year = new Date().getFullYear();

  return (
    <div className={styles.container}>
      {/* Navigation */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="18" cy="5" r="2.5" />
              <circle cx="6" cy="12" r="2.5" />
              <circle cx="18" cy="19" r="2.5" />
              <line x1="8.3" y1="13.4" x2="15.7" y2="17.6" />
              <line x1="15.7" y1="6.4" x2="8.3" y2="10.6" />
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
            A quieter place for the people you actually know
          </h1>
          <p className={styles.subtitle}>
            Spark is for close conversations, not broadcasting to strangers.
            Share what's happening, catch up with people who matter, and skip
            the noise.
          </p>
          <div className={styles.cta}>
            <Link href="/signup" className={styles.ctaPrimary}>
              Create an account
            </Link>
            <button
              onClick={() => router.push("/login")}
              className={styles.ctaSecondary}
            >
              Log in
            </button>
          </div>
        </div>

        {/* Features */}
        <div className={styles.features}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3>Built for people you know</h3>
            <p>
              Follow requests, private accounts, and a feed shaped by who you
              actually follow — not an algorithm optimizing for strangers.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <h3>Share what's happening</h3>
            <p>
              Posts, stories, and photos that disappear into a feed of people
              you follow — not a public performance.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3>Real conversations</h3>
            <p>
              Direct messages and group chats built for actually talking to
              people, not just reacting to their posts.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© {year} Spark. All rights reserved.</p>
      </footer>
    </div>
  );
}
