"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age--;
  return age;
}

function formatDate(dateString) {
  if (!dateString) return "Not provided";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "Not provided";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function ChecklistItem({ label, complete }) {
  return (
    <div className="dossier-check-item">
      <span className={`dossier-check-mark ${complete ? "complete" : "missing"}`}>
        {complete ? "✓" : "✕"}
      </span>
      <span>{label}</span>
    </div>
  );
}

export default function AdminKycPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.loggedIn || data.role !== "admin") {
          router.push("/login");
        } else {
          setChecking(false);
          loadSubmissions();
        }
      });
  }, [router]);

  async function loadSubmissions() {
    const res = await fetch("/api/admin/kyc");
    const data = await res.json();
    if (data.submissions) {
      setSubmissions(data.submissions);
    }
  }

  async function handleDecision(kycId, decision) {
    setLoadingId(kycId);
    setMessage("");
    try {
      const res = await fetch("/api/admin/kyc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kycId, decision }),
      });
      const data = await res.json();
      if (data.error) {
        setMessage(data.error);
      } else {
        setSubmissions((prev) => prev.filter((s) => s.id !== kycId));
        setMessage(`Submission ${decision}.`);
      }
    } catch (error) {
      setMessage("Something went wrong. Please try again.");
    }
    setLoadingId(null);
  }

  if (checking) {
    return (
      <div className="dossier-page">
        <div className="dossier-shell">
          <Logo />
          <p className="dossier-loading">Checking access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dossier-page">
      <div className="dossier-shell">
        <Logo />

        <div className="dossier-header">
          <div>
            <p className="dossier-eyebrow">Compliance Queue</p>
            <h2 className="dossier-title">Vendor Verification</h2>
          </div>
          <div className="dossier-count-badge">
            <span className="dossier-count-number">{submissions.length}</span>
            <span className="dossier-count-label">
              {submissions.length === 1 ? "application" : "applications"} awaiting review
            </span>
          </div>
        </div>

        {message && <p className="dossier-message">{message}</p>}

        {submissions.length === 0 && (
          <p className="dossier-empty">No pending submissions right now.</p>
        )}

        {submissions.map((s) => {
          const age = calculateAge(s.dateOfBirth);
          const isUnderage = age !== null && age < 18;

          return (
            <div className="dossier-card" key={s.id}>
              <div className="dossier-card-header">
                <span className="dossier-file-label">Applicant File</span>
                <span className="dossier-file-id">#{s.id.slice(0, 8).toUpperCase()}</span>
              </div>

              <div className="dossier-checklist">
                <ChecklistItem label="Full Name" complete={!!s.fullName} />
                <ChecklistItem label="Phone" complete={!!s.phoneNumber} />
                <ChecklistItem label="Address" complete={!!s.address} />
                <ChecklistItem label="ID Document" complete={!!s.idPhotoUrl} />
              </div>

              <div className="dossier-body">
                <div className="dossier-details">
                  <div className="dossier-field">
                    <span className="dossier-field-label">Full Name</span>
                    <span className="dossier-field-value">{s.fullName}</span>
                  </div>
                  <div className="dossier-field">
                    <span className="dossier-field-label">Email</span>
                    <span className="dossier-field-value">{s.user?.email}</span>
                  </div>
                  <div className="dossier-field">
                    <span className="dossier-field-label">Phone</span>
                    <span className="dossier-field-value">{s.phoneNumber}</span>
                  </div>
                  <div className="dossier-field">
                    <span className="dossier-field-label">Address</span>
                    <span className="dossier-field-value">{s.address}</span>
                  </div>
                  <div className="dossier-field">
                    <span className="dossier-field-label">Date of Birth</span>
                    <span className="dossier-field-value">
                      {formatDate(s.dateOfBirth)}
                      {age !== null && (
                        <span className={`dossier-age-tag ${isUnderage ? "flag" : ""}`}>
                          {age} yrs{isUnderage ? " — UNDERAGE" : ""}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="dossier-field">
                    <span className="dossier-field-label">ID Type</span>
                    <span className="dossier-field-value">{s.idType}</span>
                  </div>
                  <div className="dossier-field">
                    <span className="dossier-field-label">ID Number</span>
                    <span className="dossier-field-value">{s.idNumber}</span>
                  </div>
                </div>

                <div className="dossier-photo-panel">
                  <span className="dossier-field-label">ID Document Photo</span>
                  {s.idPhotoUrl ? (
                    <img src={s.idPhotoUrl} alt="ID document" className="dossier-photo" />
                  ) : (
                    <div className="dossier-photo-missing">No photo submitted</div>
                  )}
                </div>
              </div>

              <div className="dossier-actions">
                <button
                  className="dossier-approve-btn"
                  disabled={loadingId === s.id}
                  onClick={() => handleDecision(s.id, "approved")}
                >
                  ✓ Approve
                </button>
                <button
                  className="dossier-reject-btn"
                  disabled={loadingId === s.id}
                  onClick={() => handleDecision(s.id, "rejected")}
                >
                  DECLINE
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
