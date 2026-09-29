"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function VendorFinancePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [name, setName] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const [latestSettlement, setLatestSettlement] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [bankReference, setBankReference] = useState("");
  const [vendorNote, setVendorNote] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((meData) => {
        if (!meData.loggedIn || (meData.role !== "vendor" && meData.role !== "admin")) {
          router.push("/login");
        } else {
          setName(meData.name || "");
          setChecking(false);
          loadFinance();
          loadSettlement();
        }
      });
  }, [router]);

  async function loadFinance() {
    try {
      const res = await fetch("/api/vendor/finance");
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setData(json);
      }
    } catch (e) {
      setError("Something went wrong. Please try again.");
    }
  }

  async function loadSettlement() {
    try {
      const res = await fetch("/api/vendor/settlements");
      const json = await res.json();
      if (!json.error) {
        setLatestSettlement(json.latest);
      }
    } catch (e) {
      // Non-fatal — the page still works without the settlement badge.
    }
  }

  async function handleSubmitSettlement() {
    setSubmitError("");
    if (!bankReference.trim()) {
      setSubmitError("Please enter your bank transfer reference.");
      return;
    }
    setSubmitting(true);
    try {
      let receiptImagePath = null;
      if (receiptFile) {
        setUploading(true);
        const uploadData = new FormData();
        uploadData.append("file", receiptFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadData });
        const uploadResult = await uploadRes.json();
        setUploading(false);
        if (uploadRes.ok) {
          receiptImagePath = uploadResult.url;
        }
      }

      const res = await fetch("/api/vendor/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankReference, vendorNote, receiptImagePath }),
      });
      const json = await res.json();

      if (json.error) {
        setSubmitError(json.error);
      } else {
        setShowModal(false);
        setBankReference("");
        setVendorNote("");
        setReceiptFile(null);
        loadFinance();
        loadSettlement();
      }
    } catch (e) {
      setSubmitError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  function formatNaira(amount) {
    return "₦" + Number(amount || 0).toLocaleString("en-NG");
  }

  function timeAgo(dateStr) {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
  }

  if (checking || (!data && !error)) {
    return (
      <div style={{ minHeight: "100vh", background: "#FAF7F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#8F6829", fontFamily: "system-ui, sans-serif", letterSpacing: 1 }}>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#FAF7F2", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <p style={{ color: "#2B2A28", fontFamily: "system-ui, sans-serif" }}>{error}</p>
      </div>
    );
  }

  const payoutStages = [
    { label: "Pending Delivery", value: data.payouts.PENDING_DELIVERY, key: "PENDING_DELIVERY" },
    { label: "Ready to Settle", value: data.payouts.READY_TO_SETTLE, key: "READY_TO_SETTLE" },
    { label: "Settlement Submitted", value: data.payouts.SUBMITTED, key: "SUBMITTED" },
    { label: "Settled", value: data.payouts.SETTLED, key: "SETTLED" },
  ];

  const maxPayout = Math.max(...payoutStages.map((p) => p.value), 1);
  const pendingSettlement = latestSettlement && latestSettlement.status === "PENDING_REVIEW" ? latestSettlement : null;
  const showSubmitButton = data.payouts.READY_TO_SETTLE > 0 && !pendingSettlement;

  return (
    <div className="vf-page">
      <style>{`
        .vf-page {
          min-height: 100vh;
          background: #FAF7F2;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          padding: 32px 16px 64px;
        }
        .vf-wrap { max-width: 480px; margin: 0 auto; }
        .vf-eyebrow { color: #8F6829; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
        .vf-title { color: #2B2A28; font-size: 26px; font-weight: 800; margin-bottom: 24px; }
        .vf-stats { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 28px; }
        .vf-stat-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 12px rgba(43,42,40,0.06);
          border: 1px solid #eee5d8;
        }
        .vf-stat-card.highlight {
          background: linear-gradient(135deg, #B8863B 0%, #8F6829 100%);
          border: none;
        }
        .vf-stat-label { font-size: 12px; color: #8a7a5f; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; margin-bottom: 8px; }
        .vf-stat-card.highlight .vf-stat-label { color: rgba(255,255,255,0.85); }
        .vf-stat-value { font-size: 32px; font-weight: 800; color: #2B2A28; letter-spacing: -0.5px; }
        .vf-stat-card.highlight .vf-stat-value { color: #FAF7F2; }
        .vf-stat-sub { font-size: 12px; color: #a89a7c; margin-top: 4px; }
        .vf-stat-card.highlight .vf-stat-sub { color: rgba(255,255,255,0.7); }

        .vf-section-title { font-size: 14px; font-weight: 700; color: #2B2A28; letter-spacing: 0.5px; margin: 28px 0 12px; }
        .vf-payout-card { background: #ffffff; border-radius: 16px; padding: 20px; border: 1px solid #eee5d8; }
        .vf-payout-row { margin-bottom: 14px; }
        .vf-payout-row:last-child { margin-bottom: 0; }
        .vf-payout-top { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
        .vf-payout-label { color: #4a4136; font-weight: 600; }
        .vf-payout-amount { color: #2B2A28; font-weight: 700; }
        .vf-payout-bar-track { background: #f2ece0; border-radius: 6px; height: 8px; overflow: hidden; }
        .vf-payout-bar-fill { height: 100%; background: #B8863B; border-radius: 6px; transition: width 0.4s ease; }

        .vf-listing-card { background: #ffffff; border-radius: 16px; padding: 16px 20px; border: 1px solid #eee5d8; margin-bottom: 10px; }
        .vf-listing-top { display: flex; justify-content: space-between; align-items: center; }
        .vf-listing-title { font-size: 14px; font-weight: 700; color: #2B2A28; }
        .vf-listing-revenue { font-size: 14px; font-weight: 800; color: #8F6829; }
        .vf-listing-sub { font-size: 12px; color: #9a8b6f; margin-top: 4px; }
        .vf-empty { text-align: center; color: #a89a7c; font-size: 13px; padding: 24px 0; }

        .vf-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; padding: 7px 12px; border-radius: 20px; margin-top: 14px; }
        .vf-badge-amber { background: #FCEFD8; color: #8F6829; }
        .vf-badge-red { background: #FBE4E1; color: #A6392F; }
        .vf-badge-green { background: #E3F3E6; color: #2E7D42; }
        .vf-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #B8863B; flex-shrink: 0; }

        .vf-submit-btn { width: 100%; margin-top: 14px; background: #B8863B; color: #fff; border: none; border-radius: 10px; padding: 13px; font-size: 14px; font-weight: 700; cursor: pointer; letter-spacing: 0.2px; }
        .vf-submit-btn:active { opacity: 0.85; }

        .vf-modal-overlay { position: fixed; inset: 0; background: rgba(43,42,40,0.55); display: flex; align-items: flex-end; justify-content: center; z-index: 100; }
        .vf-modal-panel { background: #FAF7F2; width: 100%; max-width: 480px; max-height: 88vh; overflow-y: auto; border-radius: 20px 20px 0 0; padding: 24px 20px 32px; animation: vfSlideUp 0.25s ease both; box-sizing: border-box; }
        @keyframes vfSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .vf-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .vf-modal-title { font-size: 16px; font-weight: 800; color: #2B2A28; letter-spacing: 0.3px; }
        .vf-modal-close { background: none; border: none; font-size: 24px; color: #6B6258; cursor: pointer; line-height: 1; padding: 0; }
        .vf-modal-amount-label { font-size: 11px; color: #8a7a5f; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; }
        .vf-modal-amount-value { font-size: 30px; font-weight: 800; color: #8F6829; margin: 4px 0 20px; }
        .vf-modal-field-label { display: block; font-size: 12px; font-weight: 600; color: #4a4136; margin: 14px 0 6px; }
        .vf-modal-input, .vf-modal-textarea { width: 100%; font-size: 16px; padding: 12px 14px; border-radius: 10px; border: 1px solid #dcd3c2; background: #fff; color: #2B2A28; box-sizing: border-box; font-family: inherit; }
        .vf-modal-textarea { min-height: 70px; resize: vertical; }
        .vf-modal-upload-btn { width: 100%; text-align: left; font-size: 14px; padding: 12px 14px; border-radius: 10px; border: 1px dashed #B8863B; background: #FCF8EF; color: #8F6829; font-weight: 600; cursor: pointer; box-sizing: border-box; }
        .vf-modal-error { color: #A6392F; font-size: 13px; margin-top: 12px; }
        .vf-modal-submit-btn { width: 100%; margin-top: 22px; background: #B8863B; color: #fff; border: none; border-radius: 10px; padding: 14px; font-size: 15px; font-weight: 700; cursor: pointer; }
        .vf-modal-submit-btn:disabled { opacity: 0.6; }
      `}</style>

      <div className="vf-wrap">
        <div className="vf-eyebrow">Vendor Dashboard</div>
        <div className="vf-title">{name ? `${name.split(" ")[0]}'s Performance` : "Your Performance"}</div>

        <div className="vf-stats">
          <div className="vf-stat-card highlight">
            <div className="vf-stat-label">Total Sales</div>
            <div className="vf-stat-value">{formatNaira(data.totalSales)}</div>
            <div className="vf-stat-sub">{data.totalOrders} order{data.totalOrders !== 1 ? "s" : ""} fulfilled</div>
          </div>
          <div className="vf-stat-card">
            <div className="vf-stat-label">Net Earnings</div>
            <div className="vf-stat-value">{formatNaira(data.totalNet)}</div>
            <div className="vf-stat-sub">after {formatNaira(data.totalCommission)} platform commission</div>
          </div>
          <div className="vf-stat-card">
            <div className="vf-stat-label">Commission Owed</div>
            <div className="vf-stat-value">{formatNaira(data.payouts.READY_TO_SETTLE)}</div>
            <div className="vf-stat-sub">ready to settle with Silverstar</div>
            {data.payouts.PENDING_DELIVERY > 0 && (
              <div className="vf-stat-sub" style={{ marginTop: 2 }}>
                + {formatNaira(data.payouts.PENDING_DELIVERY)} pending delivery
              </div>
            )}

            {pendingSettlement && (
              <div className="vf-badge vf-badge-amber">
                <span className="vf-badge-dot" />
                Under review · submitted {timeAgo(pendingSettlement.submittedAt)}
              </div>
            )}

            {!pendingSettlement && latestSettlement && latestSettlement.status === "REJECTED" && (
              <div className="vf-badge vf-badge-red">
                Last settlement rejected{latestSettlement.adminNote ? `: ${latestSettlement.adminNote}` : ""}
              </div>
            )}

            {data.payouts.READY_TO_SETTLE === 0 && !pendingSettlement && (
              <div className="vf-badge vf-badge-green">You're all caught up</div>
            )}

            {showSubmitButton && (
              <button className="vf-submit-btn" onClick={() => setShowModal(true)}>
                Submit Settlement
              </button>
            )}
          </div>
        </div>

        <div className="vf-section-title">Commission Settlement</div>
        <div className="vf-payout-card">
          {payoutStages.map((stage) => (
            <div className="vf-payout-row" key={stage.key}>
              <div className="vf-payout-top">
                <span className="vf-payout-label">{stage.label}</span>
                <span className="vf-payout-amount">{formatNaira(stage.value)}</span>
              </div>
              <div className="vf-payout-bar-track">
                <div
                  className="vf-payout-bar-fill"
                  style={{ width: `${(stage.value / maxPayout) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="vf-section-title">Top Performing Listings</div>
        {data.listingBreakdown.length === 0 && (
          <div className="vf-listing-card">
            <div className="vf-empty">No sales yet — once an order comes in, it'll show up here.</div>
          </div>
        )}
        {data.listingBreakdown.map((l, i) => (
          <div className="vf-listing-card" key={i}>
            <div className="vf-listing-top">
              <span className="vf-listing-title">{l.title}</span>
              <span className="vf-listing-revenue">{formatNaira(l.revenue)}</span>
            </div>
            <div className="vf-listing-sub">
              {l.unitsSold} unit{l.unitsSold !== 1 ? "s" : ""} sold · {formatNaira(l.netEarnings)} net to you
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="vf-modal-overlay" onClick={() => !submitting && setShowModal(false)}>
          <div className="vf-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="vf-modal-header">
              <div className="vf-modal-title">Submit Settlement</div>
              <button className="vf-modal-close" onClick={() => setShowModal(false)} disabled={submitting}>×</button>
            </div>

            <div className="vf-modal-amount-label">Amount to settle</div>
            <div className="vf-modal-amount-value">{formatNaira(data.payouts.READY_TO_SETTLE)}</div>

            <label className="vf-modal-field-label">Bank Transfer Reference</label>
            <input
              className="vf-modal-input"
              placeholder="e.g. GTB-2409-XXXX"
              value={bankReference}
              onChange={(e) => setBankReference(e.target.value)}
              disabled={submitting}
            />

            <label className="vf-modal-field-label">Receipt (optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => setReceiptFile(e.target.files[0] || null)}
            />
            <button
              type="button"
              className="vf-modal-upload-btn"
              onClick={() => fileInputRef.current.click()}
              disabled={submitting}
            >
              {receiptFile ? receiptFile.name : "Choose Photo"}
            </button>

            <label className="vf-modal-field-label">Note (optional)</label>
            <textarea
              className="vf-modal-textarea"
              placeholder="Anything the admin should know"
              value={vendorNote}
              onChange={(e) => setVendorNote(e.target.value)}
              disabled={submitting}
            />

            {submitError && <div className="vf-modal-error">{submitError}</div>}

            <button className="vf-modal-submit-btn" onClick={handleSubmitSettlement} disabled={submitting}>
              {uploading ? "Uploading receipt..." : submitting ? "Submitting..." : "Submit for Review"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
