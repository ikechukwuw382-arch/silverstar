"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { CheckBadgeIcon, ShieldIcon, TruckIcon } from "@/components/Icons";

const serviceTypes = [
  "Printer Repair",
  "Printer Maintenance",
  "Installation",
  "Troubleshooting",
  "Printer Setup",
  "Parts Replacement",
  "Other",
];

export default function RepairServicesPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    printerBrand: "",
    printerModel: "",
    serviceType: "",
    problemDescription: "",
    phone: "",
    state: "",
    city: "",
    address: "",
    additionalInfo: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let imageUrl = null;

      if (imageFile) {
        setUploading(true);
        const uploadData = new FormData();
        uploadData.append("file", imageFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });
        const uploadResult = await uploadRes.json();
        if (uploadRes.ok) {
          imageUrl = uploadResult.url;
        }
        setUploading(false);
      }

      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, imageUrl }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      setSuccess(data.requestNumber);
      setLoading(false);
    } catch (err) {
      setError("Something went wrong.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div>
        <Navbar />
        <div className="section" style={{ paddingTop: 40, maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#B8860B",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              margin: "0 auto 20px",
            }}
          >
            ✓
          </div>
          <h2 className="card-title" style={{ marginBottom: 8 }}>Request Submitted</h2>
          <p style={{ color: "#6b6b6b", marginBottom: 24 }}>
            Your service request has been received. Our team will review it shortly.
          </p>
          <div
            style={{
              background: "#fff",
              border: "1px solid #E4E0D8",
              borderRadius: 12,
              padding: "20px",
              marginBottom: 24,
            }}
          >
            <p style={{ margin: 0, color: "#6b6b6b", fontSize: 14 }}>Request Number</p>
            <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, color: "#B8860B" }}>
              {success}
            </p>
          </div>
          <a href="/repair-services/history" className="btn" style={{ textDecoration: "none", display: "block", textAlign: "center" }}>
            View My Service Requests
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="section" style={{ paddingTop: 24, maxWidth: 560, margin: "0 auto" }}>
        <p className="repair-eyebrow">Silverstar Services</p>
        <h1 className="repair-title">Printer Repair &amp; Services</h1>
        <p style={{ color: "var(--gray)", marginBottom: 20 }}>
          Tell us what&apos;s wrong and a certified engineer will reach out with a diagnosis and quote.
        </p>

        <div className="repair-trust-strip">
          <div className="repair-trust-item">
            <CheckBadgeIcon />
            <span>Certified engineers</span>
          </div>
          <div className="repair-trust-item">
            <ShieldIcon />
            <span>Verified &amp; insured</span>
          </div>
          <div className="repair-trust-item">
            <TruckIcon />
            <span>Fast response</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card repair-card">
            <h3 className="repair-card-title">Printer &amp; Problem Details</h3>

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label className="field-label">Printer Brand</label>
                <input
                  name="printerBrand"
                  placeholder="e.g. HP"
                  value={form.printerBrand}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="field-label">Model</label>
                <input
                  name="printerModel"
                  placeholder="e.g. LaserJet 1102"
                  value={form.printerModel}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <label className="field-label">Service Type</label>
              <select
                name="serviceType"
                value={form.serviceType}
                onChange={handleChange}
                required
                style={inputStyle}
              >
                <option value="">Select Service Type</option>
                {serviceTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: 14 }}>
              <label className="field-label">Describe the Problem</label>
              <textarea
                name="problemDescription"
                placeholder="What's happening with the printer?"
                value={form.problemDescription}
                onChange={handleChange}
                required
                style={{ ...inputStyle, minHeight: 100, fontFamily: "inherit" }}
              />
            </div>

            <div style={{ marginTop: 14 }}>
              <label className="field-label">Photo of the Printer (optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                style={{ display: "none" }}
              />
              <div className="repair-file-row">
                <button
                  type="button"
                  className="repair-file-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose Photo
                </button>
                <span className="repair-file-name">
                  {imageFile ? imageFile.name : "No file chosen"}
                </span>
              </div>
            </div>
          </div>

          <div className="card repair-card">
            <h3 className="repair-card-title">Contact &amp; Location</h3>

            <label className="field-label">Phone Number</label>
            <input
              name="phone"
              placeholder="Your phone number"
              value={form.phone}
              onChange={handleChange}
              required
              style={inputStyle}
            />

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <div style={{ flex: 1 }}>
                <label className="field-label">State</label>
                <input
                  name="state"
                  placeholder="State"
                  value={form.state}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="field-label">City</label>
                <input
                  name="city"
                  placeholder="City"
                  value={form.city}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <label className="field-label">Full Service Address</label>
              <input
                name="address"
                placeholder="Street address"
                value={form.address}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginTop: 14 }}>
              <label className="field-label">Additional Information (optional)</label>
              <textarea
                name="additionalInfo"
                placeholder="Anything else the engineer should know?"
                value={form.additionalInfo}
                onChange={handleChange}
                style={{ ...inputStyle, minHeight: 70, fontFamily: "inherit" }}
              />
            </div>
          </div>

          {error && <p className="message" style={{ color: "#b3261e" }}>{error}</p>}

          <button type="submit" disabled={loading} className="btn" style={{ marginTop: 4 }}>
            {uploading ? "Uploading Photo..." : loading ? "Submitting..." : "Request an Engineer"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "13px 14px",
  borderRadius: 10,
  border: "1.5px solid var(--silver)",
  fontSize: 16,
  background: "var(--bone)",
  color: "var(--graphite)",
  boxSizing: "border-box",
};
