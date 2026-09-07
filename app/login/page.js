"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "../auth.module.css";

// useSearchParams() requires a Suspense boundary during static
// generation (Next.js App Router). Isolating it in its own tiny
// component, rather than wrapping the whole page, means the actual
// form below still renders immediately and isn't held up by this.
function RegisteredBanner() {
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "true";

  if (!justRegistered) return null;

  return (
    <div className={styles.success}>Account created — log in to get started</div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        identifier: formData.identifier,
        password: formData.password,
      });

      if (result?.error) {
        // NextAuth wraps thrown authorize() errors generically in some
        // versions, so we fall back to the same message either way —
        // never reveal which part (identifier vs password) was wrong.
        setError(result.error === "CredentialsSignin"
          ? "Invalid username/email or password"
          : result.error);
      } else {
        router.push("/home");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
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

        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Log in to continue sharing your spark</p>

        <Suspense fallback={null}>
          <RegisteredBanner />
        </Suspense>
        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} method="post" className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="identifier">Username or email</label>
            <input
              type="text"
              id="identifier"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              placeholder="Username or email"
              autoComplete="username"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              className={styles.input}
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className={styles.switchAuth}>
          Don't have an account? <Link href="/signup">Sign up</Link>
        </p>

        <Link href="/" className={styles.backHome}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to home
        </Link>
      </div>
    </div>
  );
}
