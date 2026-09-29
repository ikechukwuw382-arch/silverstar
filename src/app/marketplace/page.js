"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { PrinterIcon, CartIcon, CheckBadgeIcon, SearchIcon, ShieldIcon } from "@/components/Icons";

const CATEGORIES = [
  "Printers",
  "Toner & Ink",
  "Spare Parts",
  "Repair Services",
  "Bulk Supplies",
];

const SEARCH_PLACEHOLDERS = [
  "Search printers...",
  "Search toner & ink...",
  "Search spare parts...",
  "Search repair services...",
  "Search bulk supplies...",
];

export default function MarketplacePage() {
  const router = useRouter();
  const [listings, setListings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 });
  const [stats, setStats] = useState({ totalActiveListings: 0, verifiedVendorCount: 0 });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [page, setPage] = useState(1);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [featured, setFeatured] = useState([]);
  const resultsRef = useRef(null);

  function handleSearchKeyDown(e) {
    if (e.key === "Enter") {
      e.target.blur();
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }

  useEffect(() => {
    fetch("/api/listings?featured=1")
      .then((res) => res.json())
      .then((data) => setFeatured(data.featured || []));
  }, []);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn) setUserId(data.userId);
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % SEARCH_PLACEHOLDERS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Debounce the search box so we don't hit the database on every keystroke
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Reset to page 1 whenever the filters change
  useEffect(() => {
    setPage(1);
  }, [category, sortBy]);

  // The actual data fetch — runs whenever page, search, category, or sort changes
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      sortBy,
    });
    if (search) params.set("search", search);
    if (category !== "All") params.set("category", category);

    fetch(`/api/listings?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setListings(data.listings || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, totalCount: 0 });
        if (data.stats) setStats(data.stats);
        setLoading(false);
      });
  }, [page, search, category, sortBy]);

  async function handleAddToCart(listingId) {
    const savedY = window.scrollY;
    try {
      await handleAddToCartInner(listingId);
    } finally {
      requestAnimationFrame(() => window.scrollTo(0, savedY));
      setTimeout(() => window.scrollTo(0, savedY), 100);
    }
  }

  async function handleAddToCartInner(listingId) {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    const data = await res.json();
    if (data.error) {
      alert(data.error);
    }
  }

  function isVendorVerified(item) {
    return item.vendor?.kyc?.status === "approved";
  }

  async function handleDelete(id) {
    try {
      const res = await fetch("/api/listings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok) {
        setListings(listings.filter((item) => item.id !== id));
        setFeatured((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert(data.error || "Failed to delete listing.");
      }
    } catch (err) {
      alert("Something went wrong. Please try again.");
    }
  }

  function ProductCard({ item, featured }) {
    const vendorOnVacation = Boolean(item.vendor?.isOnVacation);
    return (
      <div
        className={`product-card${featured ? " featured-card" : ""}`}
        onClick={() => router.push(`/listings/${item.id}`)}
        style={{ cursor: "pointer" }}
      >
        <div className="product-image" style={{ position: "relative" }}>
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              sizes="(max-width: 640px) 50vw, 300px"
              style={{ objectFit: "contain", padding: "8%" }}
            />
          ) : (
            <PrinterIcon />
          )}
          <span className="product-badge">{item.condition}</span>
          {featured && <span className="featured-ribbon">★ Featured</span>}
          {Array.isArray(item.images) && item.images.length > 1 && (
            <span className="gallery-indicator">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                <rect x="7" y="7" width="14" height="14" rx="2" fill="currentColor" opacity="0.25" stroke="currentColor" strokeWidth="2" />
              </svg>
              {item.images.length}
            </span>
          )}
        </div>
        <div className="product-body">
          <span className="product-category-label">{item.category}</span>
          <div className="product-price">₦{item.price.toLocaleString()}</div>
          <h3 className="product-title">{item.title}</h3>
          <p className="product-desc">{item.description}</p>
          <div className="product-footer">
            <div
              className="vendor-tag"
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/vendors/${item.vendorId}`);
              }}
            >
              <div className="vendor-avatar">
                {(item.vendor?.name || "V").charAt(0).toUpperCase()}
              </div>
              <span className="vendor-name">{item.vendor?.name || "Vendor"}</span>
              {isVendorVerified(item) ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    color: "#2a7d46",
                    border: "1px solid #2a7d46",
                    borderRadius: 4,
                    padding: "1px 6px",
                    marginLeft: 6,
                  }}
                >
                  <CheckBadgeIcon />
                  Verified
                </span>
              ) : (
                <span
                  style={{
                    fontSize: 11,
                    color: "#a33",
                    border: "1px solid #a33",
                    borderRadius: 4,
                    padding: "1px 6px",
                    marginLeft: 6,
                  }}
                >
                  Unverified
                </span>
              )}
            </div>
            {item.vendorId === userId ? (
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id);
                }}
                aria-label="Delete listing"
                title="Delete listing"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m3 0-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7h14Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Remove
              </button>
            ) : vendorOnVacation ? (
              <button
                className="btn"
                disabled
                style={{
                  padding: "8px 14px",
                  fontSize: 13,
                  background: "#C9C4B8",
                  cursor: "not-allowed",
                }}
              >
                Unavailable
              </button>
            ) : (
              <button
                type="button" className="btn product-cta"
                style={{ padding: "8px 14px", fontSize: 13 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(item.id);
                }}
              >
                <CartIcon /> Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <div className="marketplace-header">
        <div>
          <p className="marketplace-eyebrow">Silverstar Marketplace</p>
          <h1 className="marketplace-title">Printers &amp; Print Solutions, Done Right</h1>
        </div>
        <div className="marketplace-header-stats">
          <span className="marketplace-stat-pill">
            <strong>{stats.totalActiveListings}</strong>
            <em>Active Listings</em>
          </span>
          <span className="marketplace-stat-pill">
            <strong>{stats.verifiedVendorCount}</strong>
            <em>Verified Vendors</em>
          </span>
        </div>
      </div>

      <div className="sticky-filter-bar sticky-filter-bar--top">
        <div className="mini-search-wrap">
          <span className="mini-search-icon">
            <SearchIcon />
          </span>
          <input
            type="text"
            className="mini-search-input"
            placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          {searchInput.length > 0 && (
            <button
              type="button"
              className="mini-search-clear"
              aria-label="Clear search"
              onClick={() => setSearchInput("")}
            >
              ✕
            </button>
          )}
        </div>

        <div className="category-chip-row">
          <button
            className={`category-chip ${category === "All" ? "active" : ""}`}
            onClick={() => setCategory("All")}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`category-chip ${category === c ? "active" : ""}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="section" style={{ paddingTop: 24 }}>
        <div className="marketplace-trust-banner">
          <span className="marketplace-trust-icon">
            <ShieldIcon />
          </span>
          <p>
            Every vendor on Silverstar passes identity verification before they can sell.
            Pay securely and track every order from checkout to delivery.
          </p>
        </div>

        {category === "All" && !search && featured.length > 0 && (
          <>
            <h2 className="featured-section-title">Featured Products</h2>
            <div className="featured-scroll-row">
              {featured.map((item) => (
                <div className="featured-scroll-item" key={`featured-${item.id}`}>
                  <ProductCard item={item} featured />
                </div>
              ))}
            </div>
          </>
        )}

        <div className="browse-toolbar" ref={resultsRef}>
          <span className="browse-result-count">
            {pagination.totalCount} {pagination.totalCount === 1 ? "result" : "results"}
          </span>
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="Newest">Newest</option>
            <option value="Price: Low to High">Price: Low to High</option>
            <option value="Price: High to Low">Price: High to Low</option>
          </select>
        </div>

        {loading && <p className="message">Loading listings...</p>}

        {!loading && listings.length === 0 && (
          <p className="message">
            {pagination.totalCount === 0
              ? "No listings match your search."
              : "No listings on this page."}
          </p>
        )}

        <h2 className="featured-section-title" style={{ marginTop: loading ? 0 : 8 }}>
          All Products
        </h2>

        <div className="product-grid">
          {listings.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>

        {!loading && pagination.totalPages > 1 && (
          <div className="pagination-bar">
            <button
              className="btn"
              disabled={page <= 1}
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              style={{ width: "auto", padding: "10px 18px" }}
            >
              Previous
            </button>
            <span className="pagination-label">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              className="btn"
              disabled={page >= pagination.totalPages}
              onClick={() => {
                setPage((p) => Math.min(pagination.totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              style={{ width: "auto", padding: "10px 18px" }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
