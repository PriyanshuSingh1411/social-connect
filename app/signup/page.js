"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import styles from "../auth.module.css";

const USERNAME_RE = /^[a-zA-Z0-9_.]{3,30}$/;

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "" };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ["Too short", "Weak", "Fair", "Good", "Strong", "Strong"];
  return { score, label: labels[score] };
}

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null); // null | "checking" | "available" | "taken" | "invalid"
  const usernameCheckId = useRef(0);

  const checkUsername = useCallback(async (username) => {
    if (!USERNAME_RE.test(username)) {
      setUsernameStatus(username.length > 0 ? "invalid" : null);
      return;
    }
    const requestId = ++usernameCheckId.current;
    setUsernameStatus("checking");
    try {
      const res = await axios.get(
        `/api/users/username-available?username=${encodeURIComponent(username)}`,
      );
      if (requestId !== usernameCheckId.current) return; // stale response, ignore
      setUsernameStatus(res.data.available ? "available" : "taken");
    } catch {
      if (requestId !== usernameCheckId.current) return;
      setUsernameStatus(null);
    }
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (formData.username) checkUsername(formData.username);
      else setUsernameStatus(null);
    }, 400);
    return () => clearTimeout(delay);
  }, [formData.username, checkUsername]);

  const passwordStrength = getPasswordStrength(formData.password);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setFieldErrors({ ...fieldErrors, [e.target.name]: undefined });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    if (formData.password !== formData.confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match" });
      setLoading(false);
      return;
    }

    if (usernameStatus === "taken") {
      setFieldErrors({ username: "This username is already taken" });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("/api/auth/signup", {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      if (response.status === 201) {
        router.push("/login?registered=true");
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        setFieldErrors(data.errors);
      }
      setError(data?.message || "Something went wrong. Please try again.");
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

        <h1 className={styles.title}>Create an account</h1>
        <p className={styles.subtitle}>
          Join our community and share your spark
        </p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} method="post" className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
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
              placeholder="Choose a username"
              autoComplete="username"
              required
              className={styles.input}
            />
            {usernameStatus === "checking" && (
              <span className={styles.fieldHint}>Checking availability…</span>
            )}
            {usernameStatus === "available" && (
              <span className={styles.fieldSuccess}>Username available</span>
            )}
            {usernameStatus === "taken" && (
              <span className={styles.fieldError}>
                This username is already taken
              </span>
            )}
            {usernameStatus === "invalid" && (
              <span className={styles.fieldError}>
                3-30 characters: letters, numbers, underscores, periods only
              </span>
            )}
            {fieldErrors.username && (
              <span className={styles.fieldError}>{fieldErrors.username}</span>
            )}
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
              autoComplete="email"
              required
              className={styles.input}
            />
            {fieldErrors.email && (
              <span className={styles.fieldError}>{fieldErrors.email}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              autoComplete="new-password"
              maxLength={72}
              required
              className={styles.input}
            />
            {formData.password && (
              <div className={styles.strengthMeter}>
                <div
                  className={styles.strengthBar}
                  data-score={passwordStrength.score}
                />
                <span className={styles.fieldHint}>
                  {passwordStrength.label}
                </span>
              </div>
            )}
            {fieldErrors.password && (
              <span className={styles.fieldError}>{fieldErrors.password}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              autoComplete="new-password"
              maxLength={72}
              required
              className={styles.input}
            />
            {fieldErrors.confirmPassword && (
              <span className={styles.fieldError}>
                {fieldErrors.confirmPassword}
              </span>
            )}
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className={styles.switchAuth}>
          Already have an account? <Link href="/login">Log in</Link>
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
