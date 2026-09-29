"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";
import { LockIcon, EyeIcon, EyeOffIcon } from "@/components/Icons";

function passwordChecks(password) {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const checks = passwordChecks(password);
  const isStrong = Object.values(checks).every(Boolean);
  const passwordsMatch = password && password === confirmPassword;

  async function handleSubmit(e) {
    e.preventDefault();

    if (!isStrong) {
      setStatus("error");
      setMessage("Please meet all password requirements below.");
      return;
    }

    if (!passwordsMatch) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage("");

    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword: password }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.error) {
      setStatus("error");
      setMessage(data.error);
    } else {
      setStatus("success");
      setMessage("Password reset! Redirecting to login...");
      setTimeout(() => router.push("/login"), 1200);
    }
  }

  if (!token) {
    return (
      <div className="auth-page">
        <Logo />
        <div className="auth-card">
          <p className="auth-eyebrow">Account Recovery</p>
          <h2 className="auth-title">Invalid Link</h2>
          <p className="auth-subtitle">This reset link is missing a token. Please request a new one.</p>
          <p className="auth-footer-link"><a href="/forgot-password">Request new link</a></p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <Logo />
      <div className="auth-card">
        <p className="auth-eyebrow">Account Recovery</p>
        <h2 className="auth-title">Reset Your Password</h2>
        <p className="auth-subtitle">Choose a strong new password for your account</p>

        <form onSubmit={handleSubmit}>
          <label className="auth-field-label">New password</label>
          <div className="auth-field-wrapper">
            <span className="field-icon"><LockIcon /></span>
            <input
              className="auth-input has-toggle"
              type={showPassword ? "text" : "password"}
              placeholder="Your new password"
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

          <label className="auth-field-label">Confirm new password</label>
          <div className="auth-field-wrapper">
            <span className="field-icon"><LockIcon /></span>
            <input
              className="auth-input"
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <ul className="password-checklist">
            <li className={checks.length ? "met" : ""}>At least 8 characters</li>
            <li className={checks.upper ? "met" : ""}>One uppercase letter</li>
            <li className={checks.lower ? "met" : ""}>One lowercase letter</li>
            <li className={checks.number ? "met" : ""}>One number</li>
            <li className={checks.special ? "met" : ""}>One special character</li>
          </ul>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {message && <p className={`auth-message ${status}`}>{message}</p>}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="auth-page"><Logo /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
