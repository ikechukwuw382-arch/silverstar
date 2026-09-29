"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { UserIcon, PhoneIcon, MapPinIcon, IdCardIcon, ShieldIcon } from "@/components/Icons";

export default function KycPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [idType, setIdType] = useState("NIN");
  const [idNumber, setIdNumber] = useState("");
  const [idPhotoFile, setIdPhotoFile] = useState(null);
  const [idPhotoUrl, setIdPhotoUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.loggedIn) {
          router.push("/login");
        } else {
          setChecking(false);
        }
      });
  }, [router]);

  async function handleIdPhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setIdPhotoFile(file);
    setUploadingPhoto(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const uploadData = await uploadRes.json();
    setUploadingPhoto(false);

    if (uploadData.error) {
      setStatus("error");
      setMessage("Photo upload failed: " + uploadData.error);
      return;
    }

    setIdPhotoUrl(uploadData.url);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!idPhotoUrl) {
      setStatus("error");
      setMessage("Please upload a photo of your ID document before submitting.");
      return;
    }

    setLoading(true);
    setMessage("");

    const res = await fetch("/api/kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        phoneNumber,
        address,
        dateOfBirth,
        idType,
        idNumber,
        idPhotoUrl,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.error) {
      setStatus("error");
      setMessage(data.error);
    } else {
      setStatus("success");
      setMessage("KYC submitted! Status: " + data.kyc.status + ". Redirecting to dashboard...");
      setTimeout(() => router.push("/dashboard"), 1500);
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

  return (
    <div className="auth-page">
      <Logo />
      <div className="auth-card">
        <p className="auth-eyebrow">Vendor Verification</p>
        <h2 className="auth-title">Verify Your Identity</h2>
        <p className="auth-subtitle">Required to sell or list on Silverstar</p>

        <div className="auth-trust-banner">
          <ShieldIcon />
          <p>Your information is encrypted and used only for identity verification, in line with Silverstar's KYC policy.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="auth-field-label">Full legal name</label>
          <div className="auth-field-wrapper">
            <span className="field-icon"><UserIcon /></span>
            <input
              className="auth-input"
              type="text"
              placeholder="As shown on your ID"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <label className="auth-field-label">Phone number</label>
          <div className="auth-field-wrapper">
            <span className="field-icon"><PhoneIcon /></span>
            <input
              className="auth-input"
              type="tel"
              placeholder="080XXXXXXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>

          <label className="auth-field-label">Address</label>
          <div className="auth-field-wrapper">
            <span className="field-icon"><MapPinIcon /></span>
            <input
              className="auth-input"
              type="text"
              placeholder="Street, city, state"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <label className="auth-field-label">Date of birth</label>
          <div className="auth-field-wrapper">
            <span className="field-icon"><UserIcon /></span>
            <input
              className="auth-input"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
          </div>
          <p className="auth-field-hint">You must be 18 or older to register as a vendor.</p>

          <label className="auth-field-label">ID type</label>
          <div className="auth-field-wrapper">
            <span className="field-icon"><IdCardIcon /></span>
            <select
              className="auth-input"
              value={idType}
              onChange={(e) => setIdType(e.target.value)}
            >
              <option value="NIN">National ID (NIN)</option>
              <option value="BVN">Bank Verification Number (BVN)</option>
              <option value="Passport">International Passport</option>
              <option value="Drivers License">Driver's License</option>
            </select>
          </div>

          <label className="auth-field-label">ID number</label>
          <div className="auth-field-wrapper">
            <span className="field-icon"><IdCardIcon /></span>
            <input
              className="auth-input"
              type="text"
              placeholder="Enter your ID number"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              required
            />
          </div>

          <label className="auth-field-label">ID document photo</label>
          <div className="auth-field-wrapper" style={{ flexDirection: "column", alignItems: "flex-start", gap: 10 }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleIdPhotoChange}
              required={!idPhotoUrl}
              style={{ color: "var(--silver)", fontSize: 13 }}
            />
            {uploadingPhoto && <p className="auth-message" style={{ margin: 0 }}>Uploading photo...</p>}
            {idPhotoUrl && !uploadingPhoto && (
              <img
                src={idPhotoUrl}
                alt="ID preview"
                style={{ maxWidth: 160, borderRadius: 10, marginTop: 4, border: "1px solid var(--gold-dark)" }}
              />
            )}
          </div>

          <button
            className="auth-btn"
            type="submit"
            disabled={loading || uploadingPhoto}
          >
            {loading ? "Submitting..." : "Submit for Verification"}
          </button>
        </form>
        {message && <p className={`auth-message ${status}`}>{message}</p>}
      </div>
    </div>
  );
}
