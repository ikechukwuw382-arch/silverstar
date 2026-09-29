"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { EyeIcon, EyeOffIcon, UserIcon, MailIcon, LockIcon } from "@/components/Icons";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.error) {
      setStatus("error");
      setMessage(data.error);
    } else {
      setStatus("success");
      setMessage("Account created! Redirecting to login...");
      setTimeout(() => router.push("/login"), 1200);
    }
  }

  return (
    <div className="auth-page">
      <Logo />
      <div className="auth-card">
        <p className="auth-eyebrow">Join Silverstar</p>
        <h2 className="auth-title">Create Your Account</h2>
        <p className="auth-subtitle">Nigeria's trusted printer marketplace</p>

        <form onSubmit={handleSubmit}>
          <label className="auth-field-label">Full name</label>
          <div className="auth-field-wrapper">
            <span className="field-icon"><UserIcon /></span>
            <input
              className="auth-input"
              type="text"
              placeholder="e.g. Wisdom Ikechukwu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
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

          <div className="auth-checkbox-row">
            <input
              type="checkbox"
              id="terms"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              required
            />
            <label htmlFor="terms">
              I agree to Silverstar's{" "}
              <a href="/terms-of-service" target="_blank" rel="noopener noreferrer">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>
            </label>
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        {message && <p className={`auth-message ${status}`}>{message}</p>}
        <p className="auth-footer-link">
          Already have an account? <a href="/login">Log in</a>
        </p>
      </div>
    </div>
  );
}
