"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

export default function AdminListingsPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [listings, setListings] = useState([]);
  const [removingId, setRemovingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.loggedIn || data.role !== "admin") {
          router.push("/login");
        } else {
          setChecking(false);
          loadListings();
        }
      });
  }, [router]);

  async function loadListings() {
    const res = await fetch("/api/admin/listings");
    const data = await res.json();
    if (data.listings) {
      setListings(data.listings);
    }
  }

  async function handleRemove(id) {
    setRemovingId(id);
    setMessage("");
    try {
      const res = await fetch("/api/listings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.error) {
        setMessage(data.error);
      } else {
        setListings((prev) => prev.filter((l) => l.id !== id));
        setMessage("Listing removed.");
      }
    } catch (e) {
      setMessage("Something went wrong. Please try again.");
    }
    setRemovingId(null);
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
        <h2 className="card-title">Marketplace Listings</h2>
        <p className="card-subtitle">{listings.length} active listing{listings.length !== 1 ? "s" : ""}</p>

        {message && <p className="message">{message}</p>}

        {listings.length === 0 && (
          <p style={{ marginTop: 16 }}>No active listings right now.</p>
        )}

        {listings.map((l) => (
          <div
            key={l.id}
            style={{
              border: "1px solid #444",
              borderRadius: 8,
              padding: 16,
              marginTop: 16,
            }}
          >
            <p><strong>Title:</strong> {l.title}</p>
            <p><strong>Price:</strong> ₦{Number(l.price).toLocaleString("en-NG")}</p>
            <p><strong>Category:</strong> {l.category}</p>
            <p><strong>Condition:</strong> {l.condition}</p>
            <p><strong>Vendor:</strong> {l.vendor?.name} ({l.vendor?.email})</p>
            <p><strong>Vendor KYC:</strong> {l.vendor?.kyc?.status || "not submitted"}</p>
            <p><strong>Posted:</strong> {new Date(l.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}</p>

            <button
              className="btn"
              style={{ background: "#a33", marginTop: 12 }}
              disabled={removingId === l.id}
              onClick={() => handleRemove(l.id)}
            >
              {removingId === l.id ? "Removing..." : "Remove Listing"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
