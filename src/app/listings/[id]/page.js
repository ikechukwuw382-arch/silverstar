"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { PrinterIcon, CartIcon, CheckBadgeIcon } from "@/components/Icons";

function StarRow({ rating, size = 16 }) {
  return (
    <span style={{ display: "inline-flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{
            fontSize: `${size}px`,
            color: n <= Math.round(rating) ? "#B8863B" : "#D9D3C7",
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

const SWIPE_THRESHOLD = 45;
const DOUBLE_TAP_MS = 300;
const ZOOM_SCALE = 2.4;

function ProductGallery({ images, title }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const heroTouch = useRef({ x: 0, y: 0 });
  const lightboxTouch = useRef({ x: 0, y: 0, panning: false });
  const lastTapRef = useRef(0);
  const panStartRef = useRef({ x: 0, y: 0 });

  const hasMultiple = images.length > 1;

  function goTo(index) {
    if (index < 0 || index >= images.length) return;
    setActiveIndex(index);
    setZoomed(false);
    setPan({ x: 0, y: 0 });
  }

  function openLightbox(index) {
    setActiveIndex(index);
    setZoomed(false);
    setPan({ x: 0, y: 0 });
    setLightboxOpen(true);
  }

  function closeLightbox() {
    setLightboxOpen(false);
    setZoomed(false);
    setPan({ x: 0, y: 0 });
  }

  // --- Hero swipe (not zoomed, just navigation) ---
  function onHeroTouchStart(e) {
    heroTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onHeroTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - heroTouch.current.x;
    const dy = e.changedTouches[0].clientY - heroTouch.current.y;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goTo(activeIndex + 1);
      else goTo(activeIndex - 1);
    }
  }

  // --- Lightbox: swipe to change photo, double-tap to zoom, drag to pan while zoomed ---
  function onLightboxTouchStart(e) {
    const t = e.touches[0];
    lightboxTouch.current = { x: t.clientX, y: t.clientY, panning: zoomed };
    panStartRef.current = { x: t.clientX - pan.x, y: t.clientY - pan.y };
  }

  function onLightboxTouchMove(e) {
    if (!zoomed) return;
    const t = e.touches[0];
    setPan({
      x: t.clientX - panStartRef.current.x,
      y: t.clientY - panStartRef.current.y,
    });
  }

  function onLightboxTouchEnd(e) {
    const now = Date.now();
    const t = e.changedTouches[0];
    const dx = t.clientX - lightboxTouch.current.x;
    const dy = t.clientY - lightboxTouch.current.y;
    const moved = Math.abs(dx) > 10 || Math.abs(dy) > 10;

    if (!zoomed && !moved && now - lastTapRef.current < DOUBLE_TAP_MS) {
      // Double tap → zoom in
      setZoomed(true);
      setPan({ x: 0, y: 0 });
      lastTapRef.current = 0;
      return;
    }
    if (zoomed && !moved && now - lastTapRef.current < DOUBLE_TAP_MS) {
      // Double tap while zoomed → zoom out
      setZoomed(false);
      setPan({ x: 0, y: 0 });
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    if (!zoomed && Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goTo(activeIndex + 1);
      else goTo(activeIndex - 1);
    }
  }

  if (images.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          background: "#2B2A28",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <PrinterIcon />
      </div>
    );
  }

  return (
    <div>
      <div
        onTouchStart={onHeroTouchStart}
        onTouchEnd={onHeroTouchEnd}
        onClick={() => openLightbox(activeIndex)}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1",
          borderRadius: "12px",
          overflow: "hidden",
          cursor: "zoom-in",
          background: "#F0EBE0",
        }}
      >
        <img
          key={activeIndex}
          src={images[activeIndex]}
          alt={`${title} — photo ${activeIndex + 1}`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            animation: "silverstarFade 180ms ease",
          }}
        />
        {hasMultiple && (
          <span
            style={{
              position: "absolute",
              bottom: 10,
              right: 10,
              background: "rgba(43,42,40,0.72)",
              color: "#FAF7F2",
              fontSize: 12,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 999,
              letterSpacing: "0.02em",
            }}
          >
            {activeIndex + 1} / {images.length}
          </span>
        )}
      </div>

      {hasMultiple && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 10,
            overflowX: "auto",
            paddingBottom: 2,
          }}
        >
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                flex: "0 0 auto",
                width: 56,
                height: 56,
                borderRadius: 8,
                overflow: "hidden",
                padding: 0,
                cursor: "pointer",
                background: "none",
                border: i === activeIndex ? "2px solid #B8863B" : "1.5px solid #E4E0D8",
                opacity: i === activeIndex ? 1 : 0.75,
              }}
              aria-label={`View photo ${i + 1}`}
            >
              <img
                src={src}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <div
          onClick={(e) => e.target === e.currentTarget && closeLightbox()}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(20,19,17,0.96)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px" }}>
            {hasMultiple ? (
              <span style={{ color: "#D9D3C7", fontSize: 13, fontWeight: 600 }}>
                {activeIndex + 1} / {images.length}
              </span>
            ) : (
              <span />
            )}
            <button
              onClick={closeLightbox}
              aria-label="Close"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: "none",
                background: "rgba(255,255,255,0.12)",
                color: "#FAF7F2",
                fontSize: 20,
                lineHeight: "34px",
                textAlign: "center",
                padding: 0,
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>

          <div
            onTouchStart={onLightboxTouchStart}
            onTouchMove={onLightboxTouchMove}
            onTouchEnd={onLightboxTouchEnd}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              touchAction: "none",
            }}
          >
            <img
              src={images[activeIndex]}
              alt={`${title} — photo ${activeIndex + 1}`}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                transform: `scale(${zoomed ? ZOOM_SCALE : 1}) translate(${pan.x / (zoomed ? ZOOM_SCALE : 1)}px, ${pan.y / (zoomed ? ZOOM_SCALE : 1)}px)`,
                transition: zoomed && (pan.x !== 0 || pan.y !== 0) ? "none" : "transform 180ms ease",
                userSelect: "none",
              }}
              draggable={false}
            />
          </div>

          {hasMultiple && (
            <p style={{ textAlign: "center", color: "#8A857A", fontSize: 12, padding: "6px 0 16px", margin: 0 }}>
              Swipe to browse · Double-tap to {zoomed ? "zoom out" : "zoom in"}
            </p>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes silverstarFade {
          from {
            opacity: 0.4;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    async function fetchListing() {
      try {
        const res = await fetch(`/api/listings/${id}`);
        const data = await res.json();
        if (data.error) {
          setNotFound(true);
        } else {
          setListing(data.listing);
        }
      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchListing();
  }, [id]);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`/api/listings/${id}/reviews`);
        const data = await res.json();
        if (!data.error) {
          setReviews(data.reviews);
          setAverageRating(data.averageRating);
          setTotalReviews(data.totalReviews);
        }
      } catch (err) {
        // fail silently — reviews are supplementary, not critical
      } finally {
        setReviewsLoading(false);
      }
    }
    if (id) fetchReviews();
  }, [id]);

  async function handleAddToCart(listingId) {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    const data = await res.json();
    if (data.error) {
      alert(data.error);
    } else {
      alert("Added to cart!");
    }
  }

  function isVendorVerified(item) {
    return item?.vendor?.kyc?.status === "approved";
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
      </div>
    );
  }

  if (notFound || !listing) {
    return (
      <div>
        <Navbar />
        <div style={{ padding: "40px", textAlign: "center" }}>
          <h2>Listing not found</h2>
          <p>This listing may have been removed by the vendor.</p>
        </div>
      </div>
    );
  }

  const vendorOnVacation = Boolean(listing.vendor?.isOnVacation);
  const galleryImages =
    Array.isArray(listing.images) && listing.images.length > 0
      ? listing.images
      : listing.imageUrl
      ? [listing.imageUrl]
      : [];

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 320px" }}>
            <ProductGallery images={galleryImages} title={listing.title} />
          </div>

          <div style={{ flex: "1 1 320px" }}>
            <span
              style={{
                display: "inline-block",
                fontSize: "12px",
                color: "#8F6829",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              {listing.category}
            </span>
            <h1 style={{ fontSize: "28px", marginBottom: "8px" }}>{listing.title}</h1>

            {!reviewsLoading && totalReviews > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <StarRow rating={averageRating} />
                <span style={{ fontSize: "14px", color: "#666" }}>
                  {averageRating} ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
                </span>
              </div>
            )}

            <div style={{ fontSize: "24px", fontWeight: "700", color: "#B8863B", marginBottom: "12px" }}>
              ₦{listing.price.toLocaleString()}
            </div>
            <div style={{ marginBottom: "16px", color: "#666" }}>
              Condition: <strong>{listing.condition}</strong>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "14px", marginBottom: "6px" }}>Description</h3>
              <p style={{ color: "#444", lineHeight: "1.6" }}>{listing.description}</p>
            </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "24px",
            padding: "12px 14px",
            background: "#FAF7F2",
            borderRadius: "8px",
          }}
        >
          <span onClick={() => router.push(`/vendors/${listing.vendorId}`)} className="vendor-link">Sold by <strong>{listing.vendor?.name}</strong> <span className="vendor-link-arrow">→</span></span>
          <button onClick={() => router.push(`/vendors/${listing.vendorId}`)} style={{ background: "transparent", border: "1.5px solid var(--gold)", color: "var(--gold)", borderRadius: "999px", padding: "4px 12px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>View Vendor Store →</button>
          {isVendorVerified(listing) && (
            <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#8F6829", background: "#F0E6D2", padding: "4px 10px", borderRadius: "999px", fontSize: "13px" }}>
              <CheckBadgeIcon /> Verified Vendor
            </span>
          )}
        </div>

            {vendorOnVacation && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  marginBottom: "16px",
                  padding: "14px 16px",
                  background: "#FBF0DF",
                  border: "1px solid #D9A94F",
                  borderRadius: "8px",
                }}
              >
                <span style={{ fontSize: "18px", lineHeight: 1 }}>🏖️</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: "#8F6829", fontSize: "14px" }}>
                    This shop is currently unavailable
                  </p>
                  <p style={{ margin: "4px 0 0", color: "#6B5A2F", fontSize: "13px", lineHeight: 1.5 }}>
                    {listing.vendor?.vacationMessage ||
                      "This vendor is temporarily not accepting new orders. Please check back later."}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => handleAddToCart(listing.id)}
              disabled={vendorOnVacation}
              style={{
                width: "100%",
                padding: "14px",
                background: vendorOnVacation ? "#C9C4B8" : "#B8863B",
                color: "#FAF7F2",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: vendorOnVacation ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <CartIcon /> {vendorOnVacation ? "Currently Unavailable" : "Add to Cart"}
            </button>
          </div>
        </div>

        <div style={{ marginTop: "48px", borderTop: "1px solid #E5DFD3", paddingTop: "32px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>
            Customer Reviews {!reviewsLoading && totalReviews > 0 && `(${totalReviews})`}
          </h2>

          {reviewsLoading && <p style={{ color: "#999" }}>Loading reviews...</p>}

          {!reviewsLoading && totalReviews === 0 && (
            <p style={{ color: "#999" }}>No reviews yet. Be the first to review this product after your order is delivered.</p>
          )}

          {!reviewsLoading && totalReviews > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {reviews.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: "16px",
                    background: "#FAF7F2",
                    borderRadius: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <StarRow rating={r.rating} size={13} />
                    <strong style={{ fontSize: "14px" }}>{r.user?.name || "Verified Buyer"}</strong>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#8F6829",
                        background: "#F0E6D2",
                        padding: "2px 8px",
                        borderRadius: "999px",
                      }}
                    >
                      Verified Purchase
                    </span>
                  </div>
                  {r.comment && (
                    <p style={{ color: "#444", fontSize: "14px", lineHeight: "1.5", margin: 0 }}>
                      {r.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
