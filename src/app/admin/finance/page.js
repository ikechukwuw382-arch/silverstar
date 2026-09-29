"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminFinancePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [data, setData] = useState(null);
  const [rateInput, setRateInput] = useState("");
  const [editingRate, setEditingRate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [panelType, setPanelType] = useState(null);
  const [panelLabel, setPanelLabel] = useState("");
  const [panelRows, setPanelRows] = useState(null);
  const [panelLoading, setPanelLoading] = useState(false);

  const [settlements, setSettlements] = useState([]);
  const [settlementsLoading, setSettlementsLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [lightboxSrc, setLightboxSrc] = useState(null);

  useEffect(() => {
    fetch("/api/me")
      .then(res => res.json())
      .then(meData => {
        if (!meData.loggedIn || meData.role !== "admin") {
          router.push("/login");
        } else {
          setChecking(false);
          loadFinance();
          loadSettlements();
        }
      });
  }, [router]);

  async function loadFinance() {
    const res = await fetch("/api/admin/finance");
    const json = await res.json();
    if (json.error) {
      setMessage(json.error);
      return;
    }
    setData(json);
    setRateInput(String(json.commissionRate));
  }

  async function saveRate() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/finance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionRate: parseFloat(rateInput) }),
      });
      const json = await res.json();
      if (json.error) {
        setMessage(json.error);
      } else {
        setMessage("Rate updated.");
        setEditingRate(false);
        loadFinance();
      }
    } catch (e) {
      setMessage("Something went wrong. Please try again.");
    }
    setSaving(false);
  }

  function formatNaira(amount) {
    return "₦" + Number(amount || 0).toLocaleString("en-NG");
  }

  async function openDrilldown(type, label) {
    setPanelType(type);
    setPanelLabel(label);
    setPanelRows(null);
    setPanelLoading(true);
    try {
      const res = await fetch(`/api/admin/finance/drilldown?type=${type}`);
      const json = await res.json();
      if (json.error) {
        setPanelRows([]);
      } else {
        setPanelRows(json.rows);
      }
    } catch (e) {
      setPanelRows([]);
    }
    setPanelLoading(false);
  }

  function closeDrilldown() {
    setPanelType(null);
    setPanelRows(null);
  }

  async function loadSettlements() {
    setSettlementsLoading(true);
    try {
      const res = await fetch("/api/admin/settlements");
      const json = await res.json();
      const list = json.pending || json.settlements || json.rows || (Array.isArray(json) ? json : []);
      setSettlements(list);
    } catch (e) {
      setSettlements([]);
    }
    setSettlementsLoading(false);
  }

  function timeAgo(dateStr) {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  async function reviewSettlement(id, action, adminNote) {
    setReviewBusy(true);
    setReviewMessage("");
    try {
      const res = await fetch("/api/admin/settlements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settlementId: id, action, adminNote }),
      });
      const json = await res.json();
      if (json.error) {
        setReviewMessage(json.error);
      } else {
        setRejectingId(null);
        setRejectReason("");
        loadSettlements();
        loadFinance();
      }
    } catch (e) {
      setReviewMessage("Something went wrong. Please try again.");
    }
    setReviewBusy(false);
  }

  if (checking || !data) {
    return (
      <div style={{ minHeight: "100vh", background: "#1A1917", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#B8863B", fontFamily: "'Courier New', monospace", letterSpacing: 2 }}>Printing ledger...</p>
      </div>
    );
  }

  const summaryLines = [
    { label: "Orders Processed", value: data.totalOrders, type: null },
    { label: "Platform Commission", value: formatNaira(data.totalCommission), type: "commission" },
    { label: "Vendor Net Earnings", value: formatNaira(data.totalVendorEarnings), type: "vendorNet" },
    { label: "Delivery Fees Collected", value: formatNaira(data.totalDeliveryFees), type: "deliveryFees" },
  ];

  const payoutLines = [
    { label: "Outstanding", value: formatNaira(data.payouts.OUTSTANDING), type: "outstanding" },
    { label: "Settlement Submitted", value: formatNaira(data.payouts.SUBMITTED), type: "submitted" },
    { label: "Settled", value: formatNaira(data.payouts.SETTLED), type: "settled" },
  ];

  const panelTotal = panelRows ? panelRows.reduce((sum, r) => sum + (r.amount || 0), 0) : 0;

  return (
    <div className="finance-vault">
      <style>{`
      .finance-vault {
        min-height: 100vh;
        background: #1A1917;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 48px 16px 80px;
        font-family: Georgia, 'Times New Roman', serif;
      }
      .finance-eyebrow {
        color: #8F6829;
        font-family: 'Courier New', monospace;
        letter-spacing: 4px;
        font-size: 12px;
        text-transform: uppercase;
        margin-bottom: 20px;
      }
      .finance-receipt {
        background: #F7F2E7;
        width: 100%;
        max-width: 420px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        padding: 32px 28px 40px;
        position: relative;
        clip-path: polygon(
          0% 2%, 4% 0%, 8% 2%, 12% 0%, 16% 2%, 20% 0%, 24% 2%, 28% 0%,
          32% 2%, 36% 0%, 40% 2%, 44% 0%, 48% 2%, 52% 0%, 56% 2%, 60% 0%,
          64% 2%, 68% 0%, 72% 2%, 76% 0%, 80% 2%, 84% 0%, 88% 2%, 92% 0%,
          96% 2%, 100% 0%, 100% 100%, 0% 100%
        );
      }
      .finance-title { color: #1F1B16; font-size: 22px; font-weight: 700; text-align: center; margin-bottom: 4px; }
      .finance-sub { color: #6b5f4f; font-family: 'Courier New', monospace; font-size: 11px; text-align: center; letter-spacing: 1px; margin-bottom: 24px; }
      .finance-hero { text-align: center; margin: 20px 0 28px; animation: printIn 0.5s ease both; animation-delay: 0.1s; cursor: pointer; background: none; border: none; width: 100%; padding: 0; }
      .finance-hero-label { font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 2px; color: #6b5f4f; text-transform: uppercase; margin-bottom: 6px; }
      .finance-hero-value { font-family: 'Courier New', monospace; font-size: 40px; font-weight: 700; color: #8F6829; letter-spacing: 1px; }
      .finance-divider { border: none; border-top: 1px dashed #c9bfa8; margin: 20px 0; }
      .finance-line { display: flex; justify-content: space-between; width: 100%; font-family: 'Courier New', monospace; font-size: 14px; color: #1F1B16; padding: 8px 0; animation: printIn 0.4s ease both; background: none; border: none; text-align: left; }
      .finance-line.tappable { cursor: pointer; }
      .finance-line.tappable:active { opacity: 0.6; }
      .finance-line-label { color: #4a4136; display: flex; align-items: center; gap: 6px; }
      .finance-line-value { font-weight: 700; }
      .finance-tap-hint { font-size: 10px; color: #b8a888; }
      .finance-section-label { font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #8F6829; margin: 24px 0 8px; }
      .finance-rate-row { display: flex; justify-content: space-between; align-items: center; font-family: 'Courier New', monospace; font-size: 14px; color: #1F1B16; margin-top: 8px; }
      .finance-rate-input { width: 64px; font-family: 'Courier New', monospace; font-size: 14px; padding: 4px 6px; border: 1px solid #B8863B; background: #fff; color: #1F1B16; }
      .finance-btn { font-family: 'Courier New', monospace; font-size: 12px; letter-spacing: 1px; background: #B8863B; color: #F7F2E7; border: none; padding: 6px 12px; cursor: pointer; text-transform: uppercase; }
      .finance-btn:disabled { opacity: 0.6; }
      .finance-link-btn { background: none; border: none; color: #8F6829; font-family: 'Courier New', monospace; font-size: 12px; text-decoration: underline; cursor: pointer; padding: 0; }
      .finance-message { font-family: 'Courier New', monospace; font-size: 12px; color: #8F6829; text-align: center; margin-top: 12px; }
      .finance-footer { text-align: center; margin-top: 28px; font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 2px; color: #a89a7c; }
      @keyframes printIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
      @media (prefers-reduced-motion: reduce) { .finance-hero, .finance-line { animation: none; } }

      .drill-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.6);
        display: flex; align-items: flex-end; justify-content: center; z-index: 50;
      }
      .drill-panel {
        background: #F7F2E7; width: 100%; max-width: 420px; max-height: 80vh;
        border-radius: 12px 12px 0 0; padding: 20px; overflow-y: auto;
        animation: slideUp 0.25s ease both;
      }
      @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      .drill-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
      .drill-title { font-family: 'Courier New', monospace; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; color: #8F6829; }
      .drill-close { background: none; border: none; font-size: 20px; color: #4a4136; cursor: pointer; line-height: 1; }
      .drill-count { font-family: 'Courier New', monospace; font-size: 11px; color: #6b5f4f; margin-bottom: 12px; }
      .drill-row { border-top: 1px dashed #c9bfa8; padding: 10px 0; font-family: 'Courier New', monospace; font-size: 12px; color: #1F1B16; }
      .drill-row-top { display: flex; justify-content: space-between; font-weight: 700; }
      .drill-row-sub { color: #6b5f4f; margin-top: 2px; font-size: 11px; }
      .drill-empty { text-align: center; color: #6b5f4f; font-family: 'Courier New', monospace; font-size: 12px; padding: 24px 0; }
      .drill-total { display: flex; justify-content: space-between; border-top: 1px solid #8F6829; margin-top: 12px; padding-top: 10px; font-family: 'Courier New', monospace; font-weight: 700; color: #1F1B16; }

      .settlement-card { border-top: 1px dashed #c9bfa8; padding: 12px 0; font-family: 'Courier New', monospace; }
      .settlement-row-top { display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #1F1B16; }
      .settlement-vendor { max-width: 60%; overflow-wrap: break-word; }
      .settlement-meta { font-size: 11px; color: #6b5f4f; margin-top: 4px; }
      .settlement-note { font-size: 11px; color: #4a4136; margin-top: 4px; font-style: italic; }
      .settlement-receipt-link { background: none; border: none; color: #8F6829; font-family: 'Courier New', monospace; font-size: 11px; text-decoration: underline; cursor: pointer; padding: 4px 0; }
      .settlement-actions { display: flex; gap: 8px; margin-top: 8px; }
      .settlement-reject-form { margin-top: 8px; }
      .settlement-reject-input { width: 100%; font-family: 'Courier New', monospace; font-size: 16px; padding: 6px 8px; border: 1px solid #B8863B; background: #fff; color: #1F1B16; margin-bottom: 8px; box-sizing: border-box; }
      .lightbox-panel { position: relative; background: #F7F2E7; padding: 16px; border-radius: 12px; max-width: 90vw; max-height: 85vh; }
      .lightbox-img { max-width: 100%; max-height: 75vh; display: block; }
      .lightbox-close { position: absolute; top: 4px; right: 8px; }
      `}</style>

      <div className="finance-eyebrow">Silverstar Treasury</div>

      <div className="finance-receipt">
        <div className="finance-title">Financial Ledger</div>
        <div className="finance-sub">
          {new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}
        </div>

        <button className="finance-hero" onClick={() => openDrilldown("sales", "Total Marketplace Sales")}>
          <div className="finance-hero-label">Total Marketplace Sales</div>
          <div className="finance-hero-value">{formatNaira(data.totalSales)}</div>
          <div className="finance-tap-hint">tap to view orders</div>
        </button>

        <hr className="finance-divider" />

        {summaryLines.map((line, i) => (
          line.type ? (
            <button
              key={line.label}
              className="finance-line tappable"
              style={{ animationDelay: `${0.15 + i * 0.08}s` }}
              onClick={() => openDrilldown(line.type, line.label)}
            >
              <span className="finance-line-label">{line.label}</span>
              <span className="finance-line-value">{line.value}</span>
            </button>
          ) : (
            <div className="finance-line" key={line.label} style={{ animationDelay: `${0.15 + i * 0.08}s` }}>
              <span className="finance-line-label">{line.label}</span>
              <span className="finance-line-value">{line.value}</span>
            </div>
          )
        ))}

        <div className="finance-section-label">Commission Settlement</div>
        {payoutLines.map((line, i) => (
          <button
            key={line.label}
            className="finance-line tappable"
            style={{ animationDelay: `${0.4 + i * 0.08}s` }}
            onClick={() => openDrilldown(line.type, line.label)}
          >
            <span className="finance-line-label">{line.label}</span>
            <span className="finance-line-value">{line.value}</span>
          </button>
        ))}

        <hr className="finance-divider" />

        <div className="finance-section-label">Pending Settlements</div>
        {settlementsLoading && <div className="drill-empty">Loading...</div>}
        {!settlementsLoading && settlements.length === 0 && (
          <div className="drill-empty">Nothing awaiting review.</div>
        )}
        {!settlementsLoading && settlements.map((s) => (
          <div className="settlement-card" key={s.id}>
            <div className="settlement-row-top">
              <span className="settlement-vendor">{s.vendor?.businessName || s.vendor?.name}</span>
              <span>{formatNaira(s.amountClaimed)}</span>
            </div>
            <div className="settlement-meta">Ref: {s.bankReference} · {timeAgo(s.submittedAt)}</div>
            {s.vendorNote && <div className="settlement-note">"{s.vendorNote}"</div>}
            {s.receiptImagePath && (
              <button className="settlement-receipt-link" onClick={() => setLightboxSrc(s.receiptImagePath)}>
                view receipt
              </button>
            )}
            {rejectingId === s.id ? (
              <div className="settlement-reject-form">
                <input
                  className="settlement-reject-input"
                  placeholder="Reason for rejection"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  disabled={reviewBusy}
                />
                <div className="settlement-actions">
                  <button
                    className="finance-btn"
                    onClick={() => reviewSettlement(s.id, "reject", rejectReason)}
                    disabled={reviewBusy || !rejectReason.trim()}
                  >
                    {reviewBusy ? "..." : "Confirm Reject"}
                  </button>
                  <button
                    className="finance-link-btn"
                    onClick={() => { setRejectingId(null); setRejectReason(""); }}
                    disabled={reviewBusy}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="settlement-actions">
                <button
                  className="finance-btn"
                  onClick={() => reviewSettlement(s.id, "confirm")}
                  disabled={reviewBusy}
                >
                  Confirm
                </button>
                <button
                  className="finance-link-btn"
                  onClick={() => setRejectingId(s.id)}
                  disabled={reviewBusy}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
        {reviewMessage && <div className="finance-message">{reviewMessage}</div>}

        <hr className="finance-divider" />

        <div className="finance-section-label">Platform Rate</div>
        <div className="finance-rate-row">
          {editingRate ? (
            <>
              <input
                className="finance-rate-input"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                disabled={saving}
              />
              <button className="finance-btn" onClick={saveRate} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            </>
          ) : (
          <>
            <span>{data.commissionRate}% commission on every sale</span>
            <button className="finance-link-btn" onClick={() => setEditingRate(true)}>Edit</button>
          </>
          )}
        </div>

        {message && <div className="finance-message">{message}</div>}

        <div className="finance-footer">— end of ledger —</div>
      </div>

      {panelType && (
        <div className="drill-overlay" onClick={closeDrilldown}>
          <div className="drill-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drill-header">
              <div className="drill-title">{panelLabel}</div>
              <button className="drill-close" onClick={closeDrilldown}>×</button>
            </div>

            {panelLoading && <div className="drill-empty">Loading...</div>}

            {!panelLoading && panelRows && panelRows.length === 0 && (
              <div className="drill-empty">No records yet.</div>
            )}

            {!panelLoading && panelRows && panelRows.length > 0 && (
              <>
              <div className="drill-count">{panelRows.length} record{panelRows.length !== 1 ? "s" : ""}</div>
              {panelRows.map((row, idx) => (
                <div className="drill-row" key={idx}>
                  <div className="drill-row-top">
                    <span>{row.itemTitle || `Order #${row.orderId.slice(-8)}`}</span>
                    <span>{formatNaira(row.amount)}</span>
                  </div>
                  <div className="drill-row-sub">
                    {row.customer}{row.vendorName ? ` · vendor: ${row.vendorName}` : ""} · {row.orderStatus}
                  </div>
                  <div className="drill-row-sub">
                    {new Date(row.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
                  </div>
                </div>
              ))}
              <div className="drill-total">
                <span>Total</span>
                <span>{formatNaira(panelTotal)}</span>
              </div>
              </>
              )}
          </div>
        </div>
      )}

      {lightboxSrc && (
        <div className="drill-overlay" onClick={() => setLightboxSrc(null)}>
          <div className="lightbox-panel" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxSrc} alt="Settlement receipt" className="lightbox-img" />
            <button className="drill-close lightbox-close" onClick={() => setLightboxSrc(null)}>×</button>
          </div>
        </div>
      )}
    </div>
  );
}
