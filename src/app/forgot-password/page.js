"use client";
import { useState } from "react";
import Logo from "@/components/Logo";
import { MailIcon } from "@/components/Icons";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.error) {
      setStatus("error");
      setMessage(data.error);
    } else {
      setStatus("success");
      setMessage("If that email is registered, a reset link has been sent. Check your inbox.");
    }
  }

  return (
    <div className="auth-page">
      <Logo />
      <div className="auth-card">
        <p className="auth-eyebrow">Account Recovery</p>
        <h2 className="auth-title">Forgot Your Password?</h2>
        <p className="auth-subtitle">Enter your email and we'll send you a reset link</p>

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

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {message && <p className={`auth-message ${status}`}>{message}</p>}

        <p className="auth-footer-link">
          Remembered your password? <a href="/login">Log in</a>
        </p>
      </div>
    </div>
  );
}
