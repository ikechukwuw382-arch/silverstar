"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { EyeIcon, EyeOffIcon, MailIcon, LockIcon } from "@/components/Icons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.error) {
      setStatus("error");
      setMessage(data.error);
    } else {
      setStatus("success");
      setMessage("Welcome back! Redirecting...");
      setTimeout(() => router.push("/dashboard"), 800);
    }
  }

  return (
    <div className="auth-page">
      <Logo />
      <div className="auth-card">
        <p className="auth-eyebrow">Silverstar Account</p>
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Log in to continue to your dashboard</p>

        <form onSubmit={handleSubmit}>
          <label className="auth-field-label">Email address</label>
          <div className="auth-field-wrapper">
            <span className="field-icon"><MailIcon /></span>
            <input
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <label className="auth-field-label">Password</label>
          <div className="auth-field-wrapper">
            <span className="field-icon"><LockIcon /></span>
            <input
              className="auth-input has-toggle"
              type={showPassword ? "text" : "password"}
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="auth-icon-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>
          <p className="auth-footer-link">
            <a href="/forgot-password">Forgot your password?</a>
          </p>
        </form>
        {message && <p className={`auth-message ${status}`}>{message}</p>}
        <p className="auth-footer-link">
          Don't have an account? <a href="/signup">Sign up</a>
        </p>
      </div>
    </div>
  );
}
