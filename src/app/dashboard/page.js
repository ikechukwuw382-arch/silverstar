"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

export default function DashboardPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.loggedIn) {
          router.push("/login");
        } else {
          setRole(data.role);
          setKycStatus(data.kycStatus);
          setChecking(false);
        }
      });
  }, [router]);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
  }

  if (checking) {
    return (
      <div className="auth-page">
        <Logo />
        <div className="auth-card">
          <p className="auth-message">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  function renderKycBadge() {
    if (kycStatus === "approved") {
      return <span className="auth-status-badge auth-status-approved">Verified Vendor</span>;
    }
    if (kycStatus === "pending") {
      return <span className="auth-status-badge auth-status-pending">Pending Review</span>;
    }
    if (kycStatus === "rejected") {
      return <span className="auth-status-badge auth-status-rejected">Verification Rejected</span>;
    }
    return <span className="auth-status-badge auth-status-none">Not Submitted</span>;
  }

  const isVendor = role === "vendor" || role === "admin";
  const hasFullAccess = role === "admin" || kycStatus === "approved";

  return (
    <div className="auth-page">
      <Logo />
      <div className="auth-card">
        <p className="auth-eyebrow">Silverstar Account</p>
        <h2 className="auth-title">Your Dashboard</h2>
        <p className="auth-subtitle">Manage your Silverstar account</p>

        {isVendor ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
              <span style={{ color: "var(--silver)", fontSize: 13, fontWeight: 600, opacity: 0.85 }}>
                Verification Status:
              </span>
              {renderKycBadge()}
            </div>

            {hasFullAccess ? (
              <>
                <a href="/sell" className="auth-btn">Post a Listing</a>
                <a href="/marketplace" className="auth-btn-secondary">Browse Marketplace</a>
                <a href="/vendor-orders" className="auth-btn-secondary">Orders to Fulfill</a>
                <a href="/vendor-finance" className="auth-btn-secondary">My Earnings</a>
                <a href="/shop-settings" className="auth-btn-secondary">Shop Settings</a>
                <a href="/service-jobs" className="auth-btn-secondary">Service Requests</a>
              </>
            ) : kycStatus === "pending" ? (
              <>
                <p style={{ color: "var(--silver)", opacity: 0.85, fontSize: 13.5, lineHeight: 1.6, marginBottom: 4 }}>
                  Your vendor verification is pending review. Vendor tools will unlock once you're approved — but you can still shop as a customer in the meantime.
                </p>
                <a href="/marketplace" className="auth-btn-secondary" style={{ marginTop: 16 }}>
                  Browse Marketplace
                </a>
              </>
            ) : (
              <>
                <p style={{ color: "var(--silver)", opacity: 0.85, fontSize: 13.5, lineHeight: 1.6, marginBottom: 4 }}>
                  {kycStatus === "rejected"
                    ? "Your verification was rejected. Please resubmit your details to continue as a vendor — you can still shop as a customer in the meantime."
                    : "Complete identity verification to unlock vendor tools."}
                </p>
                <a href="/kyc" className="auth-btn" style={{ marginTop: 16 }}>
                  {kycStatus === "rejected" ? "Resubmit Verification" : "Complete Identity Verification"}
                </a>
                <a href="/marketplace" className="auth-btn-secondary">Browse Marketplace</a>
              </>
            )}
          </div>
        ) : (
          <div>
            <p style={{ color: "var(--silver)", opacity: 0.85, fontSize: 13.5, lineHeight: 1.6, marginBottom: 4 }}>
              Welcome back! Browse the marketplace or start selling on Silverstar.
            </p>
            <a href="/marketplace" className="auth-btn" style={{ marginTop: 16 }}>Browse Marketplace</a>
            <a href="/kyc" className="auth-btn-secondary">Become a Vendor</a>
          </div>
        )}

        {role === "admin" && (
          <>
            <p className="auth-field-label" style={{ marginTop: 26, marginBottom: 10 }}>Admin Tools</p>
            <a href="/admin/kyc" className="auth-btn-secondary">Review Pending KYC</a>
            <a href="/admin/finance" className="auth-btn-secondary">Financial Ledger</a>
            <a href="/admin/listings" className="auth-btn-secondary">Manage Listings</a>
            <a href="/admin/vendors" className="auth-btn-secondary">Manage Vendors</a>
            <a href="/admin/orders" className="auth-btn-secondary">All Orders</a>
            <a href="/admin/service-requests" className="auth-btn-secondary">Service Oversight</a>
          </>
        )}

        <button className="auth-btn-secondary" style={{ marginTop: 20, cursor: "pointer" }} onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </div>
  );
}
