"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CartIcon } from "@/components/Icons";

export default function Navbar() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  function handleBack() {
    // If there is real history to go back to, use it; otherwise land on the marketplace.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/marketplace");
    }
  }

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        setLoggedIn(data.loggedIn);
        setRole(data.role);
        setLoading(false);
        if (data.loggedIn) {
          fetch("/api/cart")
            .then((res) => res.json())
            .then((cartData) => {
              const items = cartData.items || [];
              const count = items.reduce((sum, item) => sum + item.quantity, 0);
              setCartCount(count);
            });
        }
      });
  }, []);

  return (
    <>
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          background: "#FFFFFF",
          borderBottom: "1px solid #E4E0D8",
        }}
      >
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#2B2A28" }}>
            Silver<span style={{ color: "#B8863B" }}>star</span>
          </span>
        </a>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {loading ? null : loggedIn ? (
            <>
              <a
                href="/cart"
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  color: "#2B2A28",
                  textDecoration: "none",
                }}
              >
                <CartIcon />
                {cartCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -8,
                      background: "#B8863B",
                      color: "#FFFFFF",
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 999,
                      minWidth: 16,
                      height: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 4px",
                    }}
                  >
                    {cartCount}
                  </span>
                )}
              </a>
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={{
                    background: "none",
                    border: "1px solid #E4E0D8",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#2B2A28",
                    cursor: "pointer",
                  }}
                >
                  Menu ▾
                </button>

                {menuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "110%",
                      right: 0,
                      background: "#fff",
                      border: "1px solid #E4E0D8",
                      borderRadius: 8,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      minWidth: 180,
                      zIndex: 50,
                      overflow: "hidden",
                    }}
                  >
                    <a href="/orders" style={menuLinkStyle}>My Orders</a>
                    <a href="/repair-services" style={menuLinkStyle}>Request a Repair</a>
                    <a href="/repair-services/history" style={menuLinkStyle}>My Repair Requests</a>
                    {(role === "vendor" || role === "admin") && (
                      <>
                        <div style={{ borderTop: "1px solid #E4E0D8" }} />
                        <a href="/vendor-orders" style={menuLinkStyle}>Orders to Fulfill</a>
                        <a href="/service-jobs" style={menuLinkStyle}>Repair Jobs</a>
                      </>
                    )}
                  </div>
                )}
              </div>
              <a
                href="/dashboard"
                style={{
                  fontSize: 14,
                  color: "#FFFFFF",
                  background: "#B8863B",
                  padding: "8px 16px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                Dashboard
              </a>
            </>
          ) : (
            <>
              <a
                href="/login"
                style={{
                  fontSize: 14,
                  color: "#6B6258",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Log in
              </a>
              <a
                href="/signup"
                style={{
                  fontSize: 14,
                  color: "#FFFFFF",
                  background: "#B8863B",
                  padding: "8px 16px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                Sign up
              </a>
            </>
          )}
        </div>
      </nav>

      {pathname !== "/" && (
        <div
          style={{
            background: "#FAF7F2",
            borderBottom: "1px solid #E4E0D8",
            padding: "4px 12px",
          }}
        >
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              minHeight: 40,
              padding: "0 8px",
              background: "none",
              border: "none",
              color: "#8F6829",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.02em",
              cursor: "pointer",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 5l-7 7 7 7" />
            </svg>
            Back
          </button>
        </div>
      )}
    </>
  );
}

const menuLinkStyle = {
  display: "block",
  padding: "12px 16px",
  fontSize: 14,
  color: "#2B2A28",
  textDecoration: "none",
  borderBottom: "1px solid #F0EEE8",
};
