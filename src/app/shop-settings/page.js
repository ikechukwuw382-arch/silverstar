"use client";
import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";

const NIGERIAN_BANKS = [
  "Access Bank",
  "Citibank Nigeria",
  "Ecobank Nigeria",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "First City Monument Bank (FCMB)",
  "Globus Bank",
  "Guaranty Trust Bank (GTBank)",
  "Heritage Bank",
  "Jaiz Bank",
  "Keystone Bank",
  "Kuda Bank",
  "Moniepoint MFB",
  "OPay",
  "Optimus Bank",
  "Palmpay",
  "Parallex Bank",
  "Polaris Bank",
  "Premium Trust Bank",
  "Providus Bank",
  "Stanbic IBTC Bank",
  "Standard Chartered Bank",
  "Sterling Bank",
  "SunTrust Bank",
  "Titan Trust Bank",
  "Union Bank of Nigeria",
  "United Bank for Africa (UBA)",
  "Unity Bank",
  "Wema Bank",
  "Zenith Bank",
];

const GOLD = "#B8863B";
const GOLD_DARK = "#8F6829";
const GRAPHITE = "#1A1917";
const CREAM = "#F7F2E7";
const MONO = "'Courier New', monospace";

const vaultLabelStyle = {
  display: "block",
  color: GOLD_DARK,
  fontSize: 11,
  letterSpacing: 2,
  textTransform: "uppercase",
  marginBottom: 6,
};

const vaultInputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 4,
  border: `1px solid ${GOLD}`,
  background: CREAM,
  color: "#1F1B16",
  fontSize: 16,
  fontFamily: MONO,
  marginBottom: 18,
  boxSizing: "border-box",
};

export default function ShopSettingsPage() {
  const [bio, setBio] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [isOnVacation, setIsOnVacation] = useState(false);
  const [vacationMessage, setVacationMessage] = useState("");
  const [returnsPolicy, setReturnsPolicy] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const [zones, setZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [newZoneArea, setNewZoneArea] = useState("");
  const [newZoneFee, setNewZoneFee] = useState("");
  const [zoneSaving, setZoneSaving] = useState(false);
  const [zoneError, setZoneError] = useState("");
  const [removingZoneId, setRemovingZoneId] = useState(null);

  useEffect(() => {
    fetch("/api/vendor/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.shopBio) setBio(data.shopBio);
        if (data.businessName) setBusinessName(data.businessName);
        if (data.profilePicUrl) setProfilePicUrl(data.profilePicUrl);
        if (data.bankName) setBankName(data.bankName);
        if (data.accountNumber) setAccountNumber(data.accountNumber);
        if (data.accountHolderName) setAccountHolderName(data.accountHolderName);
        if (data.whatsappNumber) setWhatsappNumber(data.whatsappNumber);
        setIsOnVacation(Boolean(data.isOnVacation));
        if (data.vacationMessage) setVacationMessage(data.vacationMessage);
        if (data.returnsPolicy) setReturnsPolicy(data.returnsPolicy);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    loadZones();
  }, []);

  function loadZones() {
    setZonesLoading(true);
    fetch("/api/vendor/delivery-zones")
      .then((res) => res.json())
      .then((data) => {
        setZones(data.zones || []);
        setZonesLoading(false);
      })
      .catch(() => setZonesLoading(false));
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setProfilePicUrl(data.url);
      } else {
        setError("Photo upload failed. Please try again.");
      }
    } catch (err) {
      setError("Photo upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    setError("");

    const bankFieldsTouched = bankName || accountNumber || accountHolderName;
    if (bankFieldsTouched) {
      if (!bankName || !accountNumber || !accountHolderName) {
        setError("Please fill in bank, account number, and account holder name together.");
        setSaving(false);
        return;
      }
      if (!/^\d{10}$/.test(accountNumber)) {
        setError("Account number must be exactly 10 digits.");
        setSaving(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/vendor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopBio: bio,
          businessName,
          profilePicUrl,
          bankName,
          accountNumber,
          accountHolderName,
          whatsappNumber,
          isOnVacation,
          vacationMessage,
          returnsPolicy,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMessage("Saved! Your shop profile has been updated.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddZone() {
    setZoneError("");
    if (!newZoneArea.trim()) {
      setZoneError("Please enter an area name.");
      return;
    }
    if (newZoneFee === "" || Number(newZoneFee) < 0 || !Number.isFinite(Number(newZoneFee))) {
      setZoneError("Please enter a valid fee.");
      return;
    }
    setZoneSaving(true);
    try {
      const res = await fetch("/api/vendor/delivery-zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areaName: newZoneArea, fee: Number(newZoneFee) }),
      });
      const data = await res.json();
      if (data.error) {
        setZoneError(data.error);
      } else {
        setNewZoneArea("");
        setNewZoneFee("");
        loadZones();
      }
    } catch (err) {
      setZoneError("Something went wrong. Please try again.");
    }
    setZoneSaving(false);
  }

  async function handleRemoveZone(id) {
    setRemovingZoneId(id);
    try {
      await fetch(`/api/vendor/delivery-zones/${id}`, { method: "DELETE" });
      loadZones();
    } catch (err) {
      // silently ignore; zone list simply won't update
    }
    setRemovingZoneId(null);
  }

  return (
    <div>
      <Navbar />
      <div
        className="section"
        style={{
          paddingTop: 24,
          paddingBottom: 48,
          maxWidth: 480,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #2B2A28 0%, #1c1b1a 100%)",
            borderRadius: 16,
            padding: "32px 24px",
            marginBottom: 24,
          }}
        >
          <p
            style={{
              color: GOLD,
              fontSize: 12,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 4,
              textAlign: "center",
            }}
          >
            Verified Storefront
          </p>
          <h2
            className="card-title"
            style={{ color: CREAM, textAlign: "center", marginBottom: 20 }}
          >
            Shop Profile
          </h2>

          {loading ? (
            <p style={{ color: "#999", textAlign: "center" }}>Loading...</p>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: "50%",
                    border: `3px solid ${GOLD}`,
                    boxShadow: "0 0 0 4px rgba(184,134,59,0.15)",
                    overflow: "hidden",
                    cursor: "pointer",
                    position: "relative",
                    background: "#3a3936",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {profilePicUrl ? (
                    <img
                      src={profilePicUrl}
                      alt="Shop profile"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span style={{ color: GOLD_DARK, fontSize: 32, fontWeight: 600 }}>
                      {businessName ? businessName.charAt(0).toUpperCase() : "+"}
                    </span>
                  )}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: "rgba(0,0,0,0.55)",
                      color: CREAM,
                      fontSize: 10,
                      textAlign: "center",
                      padding: "4px 0",
                    }}
                  >
                    {uploading ? "Uploading..." : "Change"}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: "none" }}
                />
              </div>

              <label
                style={{
                  display: "block",
                  color: GOLD,
                  fontSize: 12,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Business Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                maxLength={60}
                placeholder="e.g. Silverstar Prints & Repairs"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 8,
                  border: "1px solid #4a4946",
                  fontSize: 16,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  marginBottom: 20,
                  background: CREAM,
                  color: "#2B2A28",
                }}
              />

              <label
                style={{
                  display: "block",
                  color: GOLD,
                  fontSize: 12,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Shop Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
                rows={5}
                placeholder="e.g. Trusted printer parts dealer since 2019. Fast delivery across Lagos."
                style={{
                  width: "100%",
                  fontSize: 15,
                  fontFamily: "inherit",
                  resize: "vertical",
                  boxSizing: "border-box",
                  background: CREAM,
                  color: "#2B2A28",
                }}
              />
              <p style={{ textAlign: "right", fontSize: 12, color: "#999", margin: "4px 0 16px" }}>
                {bio.length}/300
              </p>
            </>
          )}
        </div>

        <div
          style={{
            background: GRAPHITE,
            border: `1px solid ${GOLD_DARK}`,
            borderRadius: 16,
            padding: "32px 24px",
            marginBottom: 24,
            fontFamily: MONO,
          }}
        >
          <p
            style={{
              color: GOLD,
              fontSize: 11,
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 4,
              textAlign: "center",
            }}
          >
            Silverstar Treasury
          </p>
          <h2
            style={{
              color: CREAM,
              textAlign: "center",
              marginBottom: 8,
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            Settlement Account
          </h2>
          <p
            style={{
              color: "#8a8378",
              fontSize: 11,
              textAlign: "center",
              marginBottom: 24,
              lineHeight: 1.5,
            }}
          >
            Where your commission settlements are paid from.
            <br />
            Used only for verifying your settlement submissions.
          </p>

          {!loading && (
            <>
              <label style={vaultLabelStyle}>Bank</label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                style={vaultInputStyle}
              >
                <option value="">Select your bank</option>
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              <label style={vaultLabelStyle}>Account Number</label>
              <input
                type="text"
                inputMode="numeric"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit NUBAN"
                style={{ ...vaultInputStyle, letterSpacing: 2, marginBottom: 4 }}
              />
              <p
                style={{
                  fontSize: 10,
                  color: accountNumber && accountNumber.length !== 10 ? "#c0554f" : "#6b6258",
                  marginBottom: 18,
                  marginTop: 0,
                }}
              >
                {accountNumber.length}/10 digits
              </p>

              <label style={vaultLabelStyle}>Account Holder Name</label>
              <input
                type="text"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="Exactly as it appears on the bank account"
                style={{ ...vaultInputStyle, marginBottom: 4 }}
              />
            </>
          )}
        </div>

        {/* Contact & Availability */}
        <div
          style={{
            background: GRAPHITE,
            border: `1px solid ${GOLD_DARK}`,
            borderRadius: 16,
            padding: "32px 24px",
            marginBottom: 24,
            fontFamily: MONO,
          }}
        >
          <p
            style={{
              color: GOLD,
              fontSize: 11,
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 4,
              textAlign: "center",
            }}
          >
            Storefront Contact
          </p>
          <h2
            style={{
              color: CREAM,
              textAlign: "center",
              marginBottom: 24,
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            Contact &amp; Availability
          </h2>

          {!loading && (
            <>
              <label style={vaultLabelStyle}>WhatsApp Number</label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="e.g. 0816 871 3407"
                style={{ ...vaultInputStyle, marginBottom: 24 }}
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: isOnVacation ? 14 : 0,
                }}
              >
                <div>
                  <p style={{ color: CREAM, fontSize: 14, margin: 0, fontWeight: 600 }}>
                    Vacation Mode
                  </p>
                  <p style={{ color: "#8a8378", fontSize: 11, margin: "2px 0 0" }}>
                    Temporarily pause new orders
                  </p>
                </div>
                <div
                  role="button"
                  aria-pressed={isOnVacation}
                  onClick={() => setIsOnVacation((prev) => !prev)}
                  style={{
                    position: "relative",
                    display: "inline-block",
                    width: 46,
                    height: 26,
                    cursor: "pointer",
                    background: isOnVacation ? GOLD : "#3a3936",
                    borderRadius: 26,
                    transition: "background 0.2s",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      height: 20,
                      width: 20,
                      left: isOnVacation ? 23 : 3,
                      top: 3,
                      background: CREAM,
                      borderRadius: "50%",
                      transition: "left 0.2s",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              </div>

              {isOnVacation && (
                <>
                  <label style={{ ...vaultLabelStyle, marginTop: 14 }}>
                    Message shown to customers
                  </label>
                  <textarea
                    value={vacationMessage}
                    onChange={(e) => setVacationMessage(e.target.value)}
                    maxLength={200}
                    rows={3}
                    placeholder="e.g. We're away until Sept 20 and not accepting new orders right now."
                    style={{ ...vaultInputStyle, resize: "vertical", marginBottom: 4 }}
                  />
                  <p style={{ textAlign: "right", fontSize: 10, color: "#6b6258", margin: "0 0 4px" }}>
                    {vacationMessage.length}/200
                  </p>
                </>
              )}
            </>
          )}
        </div>

        {/* Delivery Zones */}
        <div
          style={{
            background: GRAPHITE,
            border: `1px solid ${GOLD_DARK}`,
            borderRadius: 16,
            padding: "32px 24px",
            marginBottom: 24,
            fontFamily: MONO,
          }}
        >
          <p
            style={{
              color: GOLD,
              fontSize: 11,
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 4,
              textAlign: "center",
            }}
          >
            Delivery Coverage
          </p>
          <h2
            style={{
              color: CREAM,
              textAlign: "center",
              marginBottom: 8,
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            Delivery Zones
          </h2>
          <p
            style={{
              color: "#8a8378",
              fontSize: 11,
              textAlign: "center",
              marginBottom: 24,
              lineHeight: 1.5,
            }}
          >
            Set your own delivery fee for each area you cover.
          </p>

          {zonesLoading ? (
            <p style={{ color: "#999", textAlign: "center", fontSize: 13 }}>Loading zones...</p>
          ) : (
            <>
              {zones.length === 0 && (
                <p style={{ color: "#6b6258", fontSize: 12, textAlign: "center", marginBottom: 18 }}>
                  No delivery zones set yet.
                </p>
              )}

              {zones.map((zone) => (
                <div
                  key={zone.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: CREAM,
                    borderRadius: 4,
                    padding: "10px 14px",
                    marginBottom: 10,
                  }}
                >
                  <span style={{ color: "#1F1B16", fontSize: 14 }}>{zone.areaName}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ color: GOLD_DARK, fontWeight: 700, fontSize: 14 }}>
                      ₦{zone.fee.toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleRemoveZone(zone.id)}
                      disabled={removingZoneId === zone.id}
                      style={{
                        background: "none",
                        border: "1px solid #c0554f",
                        color: "#c0554f",
                        borderRadius: 4,
                        fontSize: 11,
                        padding: "4px 10px",
                        cursor: "pointer",
                      }}
                    >
                      {removingZoneId === zone.id ? "..." : "Remove"}
                    </button>
                  </div>
                </div>
              ))}

              <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                <input
                  type="text"
                  placeholder="Area (e.g. Ikeja)"
                  value={newZoneArea}
                  onChange={(e) => setNewZoneArea(e.target.value)}
                  style={{ ...vaultInputStyle, flex: 1.4, marginBottom: 0 }}
                />
                <input
                  type="number"
                  placeholder="Fee (₦)"
                  value={newZoneFee}
                  onChange={(e) => setNewZoneFee(e.target.value)}
                  style={{ ...vaultInputStyle, flex: 1, marginBottom: 0 }}
                />
              </div>
              <button
                onClick={handleAddZone}
                disabled={zoneSaving}
                style={{
                  width: "100%",
                  marginTop: 10,
                  padding: "10px 0",
                  borderRadius: 4,
                  border: "none",
                  background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`,
                  color: CREAM,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {zoneSaving ? "Adding..." : "Add Zone"}
              </button>
              {zoneError && (
                <p style={{ color: "#e08b7a", fontSize: 12, marginTop: 8, marginBottom: 0 }}>
                  {zoneError}
                </p>
              )}
            </>
          )}
        </div>

        {/* Returns Policy */}
        <div
          style={{
            background: GRAPHITE,
            border: `1px solid ${GOLD_DARK}`,
            borderRadius: 16,
            padding: "32px 24px",
            marginBottom: 24,
            fontFamily: MONO,
          }}
        >
          <p
            style={{
              color: GOLD,
              fontSize: 11,
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 4,
              textAlign: "center",
            }}
          >
            Store Policy
          </p>
          <h2
            style={{
              color: CREAM,
              textAlign: "center",
              marginBottom: 24,
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            Returns Policy
          </h2>

          {!loading && (
            <>
              <textarea
                value={returnsPolicy}
                onChange={(e) => setReturnsPolicy(e.target.value)}
                maxLength={1000}
                rows={5}
                placeholder="e.g. Returns accepted within 7 days if item is unused and in original packaging."
                style={{ ...vaultInputStyle, resize: "vertical", marginBottom: 4 }}
              />
              <p style={{ textAlign: "right", fontSize: 10, color: "#6b6258", margin: 0 }}>
                {returnsPolicy.length}/1000
              </p>
            </>
          )}
        </div>

        {message && <p style={{ color: "#7fd88f", marginBottom: 12 }}>{message}</p>}
        {error && <p style={{ color: "#e08b7a", marginBottom: 12 }}>{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="btn"
          style={{
            width: "100%",
            background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`,
            color: CREAM,
            border: "none",
            fontWeight: 600,
            letterSpacing: 0.5,
          }}
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
