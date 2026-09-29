"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

export default function AdminVendorsPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.loggedIn || data.role !== "admin") {
          router.push("/login");
        } else {
          setChecking(false);
          loadVendors();
        }
      });
  }, [router]);

  async function loadVendors() {
    const res = await fetch("/api/admin/vendors");
    const data = await res.json();
    if (data.vendors) {
      setVendors(data.vendors);
    }
  }

  async function toggleSuspend(vendorId, currentlySuspended) {
    setUpdatingId(vendorId);
    setMessage("");
    try {
      const res = await fetch("/api/admin/vendors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, suspended: !currentlySuspended }),
      });
      const data = await res.json();
      if (data.error) {
        setMessage(data.error);
      } else {
        setVendors((prev) =>
          prev.map((v) => (v.id === vendorId ? { ...v, suspended: data.suspended } : v))
        );
        setMessage(data.suspended ? "Vendor suspended." : "Vendor reactivated.");
      }
    } catch (e) {
      setMessage("Something went wrong. Please try again.");
    }
    setUpdatingId(null);
  }

  if (checking) {
    return (
      <div className="container">
        <Logo />
        <p>Checking access...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <Logo />
      <div className="card">
        <h2 className="card-title">Vendor Management</h2>
        <p className="card-subtitle">{vendors.length} vendor{vendors.length !== 1 ? "s" : ""}</p>

        {message && <p className="message">{message}</p>}

        {vendors.length === 0 && (
          <p style={{ marginTop: 16 }}>No vendors yet.</p>
        )}

        {vendors.map((v) => (
          <div
            key={v.id}
            style={{
              border: v.suspended ? "1px solid #a33" : "1px solid #444",
              borderRadius: 8,
              padding: 16,
              marginTop: 16,
            }}
          >
            <p><strong>Name:</strong> {v.name}</p>
            <p><strong>Email:</strong> {v.email}</p>
            <p><strong>KYC:</strong> {v.kycStatus}</p>
            <p><strong>Active Listings:</strong> {v.activeListings}</p>
            <p><strong>Joined:</strong> {new Date(v.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}</p>
            <p>
              <strong>Status:</strong>{" "}
              {v.suspended ? (
                <span style={{ color: "#a33", fontWeight: "bold" }}>Suspended</span>
              ) : (
                <span style={{ color: "green", fontWeight: "bold" }}>Active</span>
              )}
            </p>

            <button
              className="btn"
              style={{ background: v.suspended ? "#2a7" : "#a33", marginTop: 12 }}
              disabled={updatingId === v.id}
              onClick={() => toggleSuspend(v.id, v.suspended)}
            >
              {updatingId === v.id
                ? "Updating..."
                : v.suspended
                ? "Reactivate Vendor"
                : "Suspend Vendor"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
