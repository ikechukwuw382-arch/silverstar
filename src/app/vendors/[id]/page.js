"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { PrinterIcon, CheckBadgeIcon, CartIcon, SearchIcon } from "@/components/Icons";

const GOLD = "#B8863B";
const GOLD_LIGHT = "#F0D9A8";
const GRAPHITE = "#1A1917";
const CREAM = "#F7F2E7";
const MONO = "'Courier New', monospace";
const CATEGORIES = ["Printers", "Toner & Ink", "Spare Parts", "Repair Services", "Bulk Supplies"];

function StarRow({ rating, size = 16 }) {
  return (
    <span style={{ display: "inline-flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{
            fontSize: `${size}px`,
            color: n <= Math.round(rating) ? "#F0D9A8" : "rgba(255,255,255,0.3)",
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.1-1.33A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.63 0-3.15-.44-4.46-1.21l-.32-.19-3.03.79.81-2.95-.21-.31A7.96 7.96 0 0 1 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8zm4.36-5.95c-.24-.12-1.41-.7-1.63-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.18-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.46-.39-.4-.54-.41-.14-.01-.3-.01-.46-.01s-.42.06-.64.3c-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.41-.58 1.61-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z" />
    </svg>
  );
}

function toWhatsAppLink(rawNumber) {
  const digits = String(rawNumber).replace(/\D/g, "");
  const withCountryCode = digits.startsWith("0") ? "234" + digits.slice(1) : digits;
  return `https://wa.me/${withCountryCode}`;
}

async function handleAddToCart(listingId) {
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

export default function VendorStorefrontPage() {
  const { id } = useParams();
  const router = useRouter();

  const [vendor, setVendor] = useState(null);
  const [listings, setListings] = useState([]);
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [returnsPolicyOpen, setReturnsPolicyOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      // Fallback for browsers/webviews without clipboard permission
      window.prompt("Copy this link:", window.location.href);
    }
  }

  useEffect(() => {
    async function fetchStorefront() {
      try {
        const res = await fetch(`/api/vendors/${id}`);
        const data = await res.json();
        if (data.error) {
          setNotFound(true);
        } else {
          setVendor(data.vendor);
          setListings(data.listings);
          setDeliveryZones(data.deliveryZones || []);
          setAverageRating(data.averageRating);
          setTotalReviews(data.totalReviews);
        }
      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchStorefront();
  }, [id]);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div style={{ padding: "60px 24px", textAlign: "center", color: "#999" }}>
          Loading shop...
        </div>
      </div>
    );
  }

  if (notFound || !vendor) {
    return (
      <div>
        <Navbar />
        <div style={{ padding: "60px 24px", textAlign: "center" }}>
          <h2>Shop not found</h2>
          <p style={{ color: "#999" }}>This vendor may no longer be active on Silverstar.</p>
        </div>
      </div>
    );
  }

  const memberSince = new Date(vendor.joinedAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const initial = (vendor.businessName || vendor.name || "V").charAt(0).toUpperCase();
  const vendorOnVacation = Boolean(vendor.isOnVacation);

  const availableCategories = CATEGORIES.filter((c) =>
    listings.some((l) => l.category === c)
  );
  const showCategoryTabs = availableCategories.length > 1;
  const filteredListings = listings
    .filter((l) => selectedCategory === "All" || l.category === selectedCategory)
    .filter((l) =>
      searchTerm.trim() === ""
        ? true
        : l.title.toLowerCase().includes(searchTerm.trim().toLowerCase())
    );

  return (
    <div>
      <Navbar />

      {/* Hero header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1F1B14 0%, #3B2E1A 55%, #6B4E23 100%)",
          padding: "40px 24px 32px",
          color: "#FAF7F2",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: "50%",
                background: vendor.profilePicUrl ? `url(${vendor.profilePicUrl}) center/cover no-repeat` : "rgba(255,255,255,0.12)",
                border: "2px solid rgba(240,217,168,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 30,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {!vendor.profilePicUrl && initial}
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>
                  {vendor.businessName || vendor.name}
                </h1>
                  {vendor.businessName && vendor.businessName !== vendor.name && (<p style={{ margin: "2px 0 0", fontSize: 13, color: "#C9BB9C" }}>Owned by {vendor.name}</p>)}
                {vendor.verified && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      background: "rgba(240,217,168,0.15)",
                      border: "1px solid rgba(240,217,168,0.5)",
                      color: "#F0D9A8",
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: 999,
                    }}
                  >
                    <CheckBadgeIcon /> Verified Vendor
                  </span>
                )}
                <button
                  onClick={handleCopyLink}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    background: linkCopied ? "rgba(46,125,50,0.2)" : "rgba(255,255,255,0.08)",
                    border: `1px solid ${linkCopied ? "#4CAF50" : "rgba(240,217,168,0.35)"}`,
                    color: linkCopied ? "#8FD99B" : "#E8DCC4",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 999,
                    cursor: "pointer",
                  }}
                >
                  {linkCopied ? (
                    "✓ Link Copied"
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Copy Shop Link
                    </>
                  )}
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                {totalReviews > 0 ? (
                  <>
                    <StarRow rating={averageRating} />
                    <span style={{ fontSize: 13, color: "#E8DCC4" }}>
                      {averageRating} ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: 13, color: "#C9BB9C" }}>No reviews yet</span>
                )}
                <span style={{ color: "#8A7A5C" }}>•</span>
                <span style={{ fontSize: 13, color: "#E8DCC4" }}>
                  Member since {memberSince}
                </span>
                <span style={{ color: "#8A7A5C" }}>•</span>
                <span style={{ fontSize: 13, color: "#E8DCC4" }}>
                  {listings.length} {listings.length === 1 ? "product" : "products"}
                </span>
              </div>

              {vendor.shopBio && (
                <p
                  style={{
                    margin: "14px 0 0 0",
                    color: "#EDE3D0",
                    fontSize: 14,
                    lineHeight: 1.6,
                    maxWidth: 560,
                  }}
                >
                  {vendor.shopBio}
                </p>
              )}

              {vendor.whatsappNumber && !vendorOnVacation && (
                <a
                  href={toWhatsAppLink(vendor.whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    marginTop: 16,
                    background: "#25D366",
                    color: "#0B2E1A",
                    fontWeight: 700,
                    fontSize: 13,
                    padding: "9px 16px",
                    borderRadius: 999,
                    textDecoration: "none",
                  }}
                >
                  <WhatsAppIcon /> Chat on WhatsApp
                </a>
              )}
            </div>
          </div>

          {vendorOnVacation && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                marginTop: 20,
                padding: "14px 16px",
                background: "rgba(240,217,168,0.12)",
                border: "1px solid rgba(240,217,168,0.5)",
                borderRadius: 8,
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>🏖️</span>
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: GOLD_LIGHT, fontSize: 14 }}>
                  This shop is currently unavailable
                </p>
                <p style={{ margin: "4px 0 0", color: "#E8DCC4", fontSize: 13, lineHeight: 1.5 }}>
                  {vendor.vacationMessage ||
                    "This vendor is temporarily not accepting new orders. Please check back later."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delivery & Returns */}
      {(deliveryZones.length > 0 || vendor.returnsPolicy) && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px 0" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {deliveryZones.length > 0 && (
              <div
                style={{
                  background: GRAPHITE,
                  border: "1px solid #8F6829",
                  borderRadius: 12,
                  padding: "20px 22px",
                  fontFamily: MONO,
                }}
              >
                <p
                  style={{
                    color: GOLD,
                    fontSize: 11,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    margin: "0 0 12px",
                  }}
                >
                  Delivery Coverage
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto", paddingRight: 4 }}>
                  {deliveryZones.map((zone) => (
                    <div
                      key={zone.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        borderBottom: "1px dashed #4A473F",
                        paddingBottom: 6,
                        fontSize: 14,
                      }}
                    >
                      <span style={{ color: CREAM }}>{zone.areaName}</span>
                      <span style={{ color: GOLD, fontWeight: 700 }}>
                        ₦{zone.fee.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <p style={{ color: "#8a8378", fontSize: 11, margin: "12px 0 0" }}>
                  Delivering outside these areas? Message the vendor to confirm.
                </p>
              </div>
            )}

            {vendor.returnsPolicy && (
              <div
                style={{
                  background: GRAPHITE,
                  border: "1px solid #8F6829",
                  borderRadius: 12,
                  padding: "20px 22px",
                  fontFamily: MONO,
                }}
              >
                <button
                  onClick={() => setReturnsPolicyOpen(!returnsPolicyOpen)}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <p
                    style={{
                      color: GOLD,
                      fontSize: 11,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      margin: 0,
                    }}
                  >
                    Returns Policy
                  </p>
                  <span style={{ color: CREAM, fontSize: 16 }}>
                    {returnsPolicyOpen ? "−" : "+"}
                  </span>
                </button>
                {returnsPolicyOpen && (
                  <p
                    style={{
                      color: "#E8DCC4",
                      fontSize: 13,
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      margin: "14px 0 0",
                    }}
                  >
                    {vendor.returnsPolicy}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>
            {listings.length > 0 ? `Products from ${vendor.name}` : "No products yet"}
          </h2>
          {filteredListings.length > 4 && (
            <button onClick={() => setShowAll(!showAll)} style={{ background: "transparent", border: "1.5px solid var(--gold)", color: "var(--gold)", borderRadius: "999px", padding: "4px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {showAll ? "Show Less" : `View All (${filteredListings.length})`}
            </button>
          )}
        </div>

        {listings.length > 3 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#fff",
              border: "1px solid #E4E0D8",
              borderRadius: 999,
              padding: "9px 16px",
              marginBottom: 16,
            }}
          >
            <SearchIcon />
            <input
              type="text"
              placeholder={`Search ${vendor.name}'s products...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                flex: 1,
                fontSize: 14,
                background: "transparent",
                color: "var(--graphite)",
              }}
            />
            {searchTerm.length > 0 && (
              <button
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
                style={{ background: "none", border: "none", color: "#8A857A", cursor: "pointer", fontSize: 14, padding: 0 }}
              >
                ✕
              </button>
            )}
          </div>
        )}

        {showCategoryTabs && (
          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 12,
              marginBottom: 6,
              WebkitOverflowScrolling: "touch",
            }}
          >
            {["All", ...availableCategories].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                style={{
                  flexShrink: 0,
                  padding: "7px 16px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: `1.5px solid ${selectedCategory === c ? GOLD : "#E4E0D8"}`,
                  background: selectedCategory === c ? GOLD : "transparent",
                  color: selectedCategory === c ? "#fff" : "#6B6258",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {listings.length === 0 && (
          <p style={{ color: "#999" }}>This vendor hasn't listed any products yet. Check back soon.</p>
        )}

        {listings.length > 0 && filteredListings.length === 0 && (
          <p style={{ color: "#999" }}>
            {searchTerm
              ? `No products matching "${searchTerm}".`
              : "No products in this category right now."}
          </p>
        )}

        <div
          style={{
            display: "flex",
            flexWrap: showAll ? "wrap" : "nowrap",
            overflowX: showAll ? "visible" : "auto",
                          WebkitOverflowScrolling: "touch",
                          paddingBottom: 8,
                          scrollSnapType: "x mandatory",
            gap: 16,
          }}
        >
          {filteredListings.map((item) => (
            <div className="storefront-card"
              key={item.id}
              onClick={() => router.push(`/listings/${item.id}`)}
              style={{ display: "flex", flexDirection: "column", height: "auto",
                cursor: "pointer",
                border: "1px solid #E4E0D8",
                borderRadius: 16,
                overflow: "hidden",
                background: "#fff",
                              minWidth: 165,
                              maxWidth: 165,
                              flexShrink: 0,
                              scrollSnapAlign: "start",
              }}
            >
              <div
                className="storefront-card-image"
                style={{
                  position: "relative",
                  aspectRatio: "1 / 1",
                  overflow: "hidden",
                  background: item.imageUrl
                    ? "none"
                    : "linear-gradient(135deg, #F4EDE0 0%, #EADFC6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    style={{ width: "100%", height: "100%", objectFit: "contain", padding: "8%", boxSizing: "border-box", display: "block" }}
                  />
                ) : (
                  <PrinterIcon />
                )}
                <span className="product-badge">{item.condition}</span>
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
                  <div style={{ padding: 12, minHeight: 90, display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
                <div>
                  <span className="product-category-label">{item.category}</span>
                  <p className="product-price" style={{ margin: "0 0 3px" }}>
                    ₦{item.price.toLocaleString()}
                  </p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, lineHeight: 1.3, color: "var(--graphite)" }}>
                    {item.title}
                  </p>
                </div>
                {vendorOnVacation ? (
                  <button
                    disabled
                    style={{
                      marginTop: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      background: "#C9C4B8",
                      color: "#fff",
                      border: "none",
                      borderRadius: 999,
                      padding: "7px 8px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "not-allowed",
                    }}
                  >
                    Unavailable
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAddToCart(item.id); }}
                    style={{
                      marginTop: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      background: "linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%)",
                      boxShadow: "0 6px 14px rgba(184, 134, 59, 0.3)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 999,
                      padding: "7px 8px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <CartIcon size={14} /> Add to Cart
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
