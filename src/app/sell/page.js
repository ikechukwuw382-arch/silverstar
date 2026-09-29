"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

const MAX_PHOTOS = 6;

export default function SellPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Printers");
  const [condition, setCondition] = useState("New");
  const [price, setPrice] = useState("");
  const [photos, setPhotos] = useState([]); // [{ id, file, previewUrl }]
  const [uploadProgress, setUploadProgress] = useState(null); // { current, total } | null
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.loggedIn) {
          router.push("/login");
        } else if (data.role !== "vendor" && data.role !== "admin") {
          router.push("/kyc");
        } else {
          setChecking(false);
        }
      });
  }, [router]);

  useEffect(() => {
    // Revoke object URLs on unmount to avoid leaking memory
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleImageChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setPhotos((prev) => {
      const room = MAX_PHOTOS - prev.length;
      const accepted = files.slice(0, room);
      const additions = accepted.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      return [...prev, ...additions];
    });

    // Allow re-selecting the same file again later
    e.target.value = "";
  }

  function removePhoto(id) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  function makeCover(id) {
    setPhotos((prev) => {
      const index = prev.findIndex((p) => p.id === id);
      if (index <= 0) return prev;
      const next = [...prev];
      const [chosen] = next.splice(index, 1);
      next.unshift(chosen);
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const images = [];

    if (photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        setUploadProgress({ current: i + 1, total: photos.length });

        const formData = new FormData();
        formData.append("file", photos[i].file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();

        if (uploadData.error) {
          setUploadProgress(null);
          setLoading(false);
          setStatus("error");
          setMessage(`Photo ${i + 1} failed to upload: ${uploadData.error}`);
          return;
        }
        images.push(uploadData.url);
      }
      setUploadProgress(null);
    }

    const imageUrl = images[0] || null;

    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, category, price, imageUrl, images, condition }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.error) {
      setStatus("error");
      setMessage(data.error);
    } else {
      setStatus("success");
      setMessage("Listing published! Redirecting...");
      setTimeout(() => router.push("/marketplace"), 1200);
    }
  }

  if (checking) {
    return (
      <div className="auth-page">
        <Logo />
        <div className="auth-card">
          <p className="auth-message">Checking your session...</p>
        </div>
      </div>
    );
  }

  const formattedPrice =
    price && !isNaN(Number(price)) ? `₦${Number(price).toLocaleString()}` : null;

  const roomLeft = MAX_PHOTOS - photos.length;

  return (
    <div className="auth-page">
      <Logo />
      <div className="auth-card">
        <p className="auth-eyebrow">Vendor Tools</p>
        <h2 className="auth-title">List an Item</h2>
        <p className="auth-subtitle">Reach verified buyers across Nigeria</p>

        <form onSubmit={handleSubmit}>
          <div className="auth-subcard">
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <h3 className="auth-subcard-title">Photos</h3>
              <span className="auth-field-hint" style={{ margin: 0 }}>
                {photos.length}/{MAX_PHOTOS}
              </span>
            </div>

            {photos.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                  marginTop: 4,
                }}
              >
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    style={{
                      position: "relative",
                      borderRadius: 10,
                      overflow: "hidden",
                      aspectRatio: "1 / 1",
                      border: index === 0 ? "2px solid #B8863B" : "1px solid #E4E0D8",
                      cursor: index === 0 ? "default" : "pointer",
                    }}
                    onClick={() => index !== 0 && makeCover(photo.id)}
                    title={index === 0 ? "Cover photo" : "Tap to set as cover photo"}
                  >
                    <img
                      src={photo.previewUrl}
                      alt={`Photo ${index + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    {index === 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: 4,
                          left: 4,
                          background: "#B8863B",
                          color: "#FAF7F2",
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePhoto(photo.id);
                      }}
                      aria-label="Remove photo"
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(43,42,40,0.75)",
                        color: "#FAF7F2",
                        fontSize: 14,
                        lineHeight: "22px",
                        textAlign: "center",
                        padding: 0,
                        cursor: "pointer",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="auth-dropzone">
                <p className="auth-dropzone-empty">Add up to {MAX_PHOTOS} photos</p>
              </div>
            )}

            <input
              id="listing-photo-input"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
            <div className="auth-file-row">
              <button
                type="button"
                className="auth-file-btn"
                onClick={() => document.getElementById("listing-photo-input")?.click()}
                disabled={roomLeft <= 0}
              >
                {photos.length === 0 ? "Choose Photos" : "Add More"}
              </button>
              <span className="auth-file-name">
                {roomLeft > 0
                  ? `${roomLeft} more allowed`
                  : "Maximum reached"}
              </span>
            </div>
            <p className="auth-field-hint" style={{ marginTop: 10 }}>
              Clear, well-lit photos from different angles help buyers trust your listing.
              The first photo is shown as the cover — tap another photo to make it the cover.
            </p>
          </div>

          <div className="auth-subcard">
            <h3 className="auth-subcard-title">Item Details</h3>

            <label className="auth-field-label" style={{ marginTop: 0 }}>Title</label>
            <input
              className="auth-input"
              type="text"
              placeholder="e.g. HP LaserJet Pro M404dn"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <label className="auth-field-label">Description</label>
            <textarea
              className="auth-input"
              style={{ minHeight: 90, resize: "vertical", fontFamily: "inherit" }}
              placeholder="Describe the item's condition, specs, and any details buyers should know"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label className="auth-field-label">Category</label>
                <select
                  className="auth-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Printers">Printers</option>
                  <option value="Toner & Ink">Toner &amp; Ink</option>
                  <option value="Spare Parts">Spare Parts</option>
                  <option value="Repair Services">Repair Services</option>
                  <option value="Bulk Supplies">Bulk Supplies</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="auth-field-label">Condition</label>
                <select
                  className="auth-input"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                >
                  <option value="New">New</option>
                  <option value="Refurbished">Refurbished</option>
                  <option value="Used">Used</option>
                </select>
              </div>
            </div>
          </div>

          <div className="auth-subcard">
            <h3 className="auth-subcard-title">Pricing</h3>
            <label className="auth-field-label" style={{ marginTop: 0 }}>Price (₦)</label>
            <input
              className="auth-input"
              type="number"
              placeholder="e.g. 85000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              required
            />
            {formattedPrice && (
              <p className="auth-price-preview">
                Buyers will see: <strong>{formattedPrice}</strong>
              </p>
            )}
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {uploadProgress
              ? `Uploading photo ${uploadProgress.current} of ${uploadProgress.total}...`
              : loading
              ? "Publishing..."
              : "Publish Listing"}
          </button>
        </form>
        {message && <p className={`auth-message ${status}`}>{message}</p>}
      </div>
    </div>
  );
}
