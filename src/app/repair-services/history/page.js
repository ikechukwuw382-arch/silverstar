"use client";
import { useEffect, useState, useRef } from "react";
import Navbar from "@/components/Navbar";

const stageBuckets = [
  { label: "Requested", statuses: ["Requested"] },
  { label: "Review", statuses: ["Reviewing"] },
  { label: "Assigned", statuses: ["Engineer Assigned"] },
  { label: "Diagnose", statuses: ["On the Way", "Diagnosing"] },
  { label: "Payment", statuses: ["Awaiting Payment"] },
  { label: "Repair", statuses: ["Repairing"] },
  { label: "Done", statuses: ["Completed"] },
];
function getStageIndex(status) {
  const idx = stageBuckets.findIndex((b) => b.statuses.includes(status));
  return idx === -1 ? 0 : idx;
}

const quoteStatusClass = {
  Pending: "auth-status-pending",
  Accepted: "auth-status-approved",
  Declined: "auth-status-rejected",
};

export default function ServiceHistoryPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingImage, setViewingImage] = useState(null);
  const [formState, setFormState] = useState({});
  const [copiedFor, setCopiedFor] = useState(null);
  const fileInputRefs = useRef({});

  function updateForm(quoteId, patch) {
    setFormState((prev) => ({ ...prev, [quoteId]: { ...prev[quoteId], ...patch } }));
  }

  function copyToClipboard(text, quoteId) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedFor(quoteId);
      setTimeout(() => setCopiedFor(null), 1500);
    }
  }

  async function loadRequests() {
    const res = await fetch("/api/service-requests");
    const data = await res.json();
    setRequests(data.requests || []);
    setLoading(false);
  }

  async function respondToQuote(quoteId, response) {
    const res = await fetch("/api/service-requests/quote/respond", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteId, response }),
    });
    if (res.ok) loadRequests();
  }

  async function handleUpload(quoteId, file) {
    if (!file) return;
    updateForm(quoteId, { uploading: true, error: "" });
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        updateForm(quoteId, { proofPath: data.url, uploading: false });
      } else {
        updateForm(quoteId, { uploading: false, error: "Upload failed. Please try again." });
      }
    } catch (e) {
      updateForm(quoteId, { uploading: false, error: "Upload failed. Please try again." });
    }
  }

  async function handleSubmitPayment(quoteId) {
    const form = formState[quoteId] || {};
    if (!form.reference || !form.reference.trim()) {
      updateForm(quoteId, { error: "Please enter your payment reference or transaction ID." });
      return;
    }
    updateForm(quoteId, { submitting: true, error: "" });
    try {
      const res = await fetch("/api/service-requests/quote/submit-payment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId,
          paymentReference: form.reference,
          proofImagePath: form.proofPath,
        }),
      });
      const data = await res.json();
      if (data.error) {
        updateForm(quoteId, { submitting: false, error: data.error });
      } else {
        updateForm(quoteId, { submitting: false });
        loadRequests();
      }
    } catch (e) {
      updateForm(quoteId, { submitting: false, error: "Something went wrong. Please try again." });
    }
  }

  function formatNaira(amount) {
    return "₦" + Number(amount || 0).toLocaleString("en-NG");
  }

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <div>
      <Navbar />
      <div className="section" style={{ paddingTop: 28, paddingBottom: 40, maxWidth: 560, margin: "0 auto" }}>
        <p
          style={{
            color: "var(--gold)",
            fontSize: 11,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          Repair Tracking
        </p>
        <h2 className="card-title" style={{ marginBottom: 26 }}>My Service Requests</h2>

        {loading && <p className="message">Loading requests...</p>}

        {!loading && requests.length === 0 && (
          <p className="message">You haven't submitted any service requests yet.</p>
        )}

        {requests.map((req) => {
          const stageIndex = getStageIndex(req.status);
          const quote = req.quote;
          const form = quote ? formState[quote.id] || {} : {};
          const paymentStatus = quote?.paymentStatus || "UNPAID";

          return (
            <div key={req.id} className="ticket-card">
              <div className="ticket-zigzag" />
              <div className="ticket-body">
                <div className="ticket-header">
                  <span className="ticket-number">{req.requestNumber}</span>
                  <span className="ticket-date">
                    {new Date(req.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="ticket-stepper">
                  {stageBuckets.map((stage, i) => (
                    <div key={stage.label} style={{ display: "flex", alignItems: "center", flex: i < stageBuckets.length - 1 ? 1 : "0 0 auto" }}>
                      <div
                        className={
                          "ticket-stepper-dot" +
                          (i < stageIndex ? " done" : i === stageIndex ? " active" : "")
                        }
                      />
                      {i < stageBuckets.length - 1 && (
                        <div className={"ticket-stepper-line" + (i < stageIndex ? " done" : "")} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="ticket-stepper-labels">
                  {stageBuckets.map((stage, i) => (
                    <span key={stage.label} className={i === stageIndex ? "active" : ""}>
                      {stage.label}
                    </span>
                  ))}
                </div>

                <span className="ticket-status-label">{req.status}</span>

                {req.imageUrl && (
                  <img
                    src={req.imageUrl}
                    alt="Printer"
                    className="ticket-thumb"
                    onClick={() => setViewingImage(req.imageUrl)}
                    style={{ cursor: "zoom-in" }}
                  />
                )}

                <p className="ticket-service-line">
                  {req.printerBrand} {req.printerModel} — {req.serviceType}
                </p>
                <p className="ticket-problem">{req.problemDescription}</p>

                {quote && (
                  <div className="ticket-receipt">
                    <div className="ticket-receipt-title">
                      <span>Engineer's Quote</span>
                      <span className={`auth-status-badge ${quoteStatusClass[quote.status] || "auth-status-pending"}`}>
                        {quote.status}
                      </span>
                    </div>
                    <p className="ticket-receipt-diagnosis">"{quote.diagnosis}"</p>
                    <div className="ticket-receipt-row">
                      <span>Parts</span>
                      <span>₦{quote.partsCost.toLocaleString()}</span>
                    </div>
                    <div className="ticket-receipt-row">
                      <span>Labour</span>
                      <span>₦{quote.labourCost.toLocaleString()}</span>
                    </div>
                    <div className="ticket-receipt-total">
                      <span>Total</span>
                      <span>₦{quote.totalCost.toLocaleString()}</span>
                    </div>

                    {quote.status === "Pending" && (
                      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                        <button
                          onClick={() => respondToQuote(quote.id, "Accepted")}
                          className="auth-btn"
                          style={{ margin: 0, flex: 1 }}
                        >
                          Accept Quote
                        </button>
                        <button
                          onClick={() => respondToQuote(quote.id, "Declined")}
                          className="auth-btn-secondary"
                          style={{ margin: 0, flex: 1, borderColor: "#c0554f", color: "#e08b7a" }}
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {quote.status === "Accepted" && (
                      <div className="repair-pay-wrap">
                        {paymentStatus === "PAID" && (
                          <div className="repair-pay-status-banner repair-pay-status-confirmed">
                            ✓ Payment Confirmed by {req.engineer?.name || "the engineer"}
                          </div>
                        )}

                        {paymentStatus === "PAYMENT_SUBMITTED" && (
                          <div className="repair-pay-status-banner repair-pay-status-submitted">
                            Payment Submitted — Awaiting Confirmation
                            <br />
                            Ref: {quote.paymentReference}
                          </div>
                        )}

                        {(paymentStatus === "UNPAID" || paymentStatus === "PAYMENT_REJECTED") && (
                          <>
                            {paymentStatus === "PAYMENT_REJECTED" && (
                              <div className="repair-pay-status-banner repair-pay-status-rejected">
                                Payment Rejected: {quote.paymentRejectedReason || "Please check your details and resubmit."}
                              </div>
                            )}

                            {req.engineer?.bankName ? (
                              <>
                                <div className="repair-pay-bank-row">
                                  <span className="repair-pay-bank-label">Bank</span>
                                  <span className="repair-pay-bank-value">{req.engineer.bankName}</span>
                                </div>
                                <div className="repair-pay-bank-row">
                                  <span className="repair-pay-bank-label">Account Number</span>
                                  <span style={{ display: "flex", alignItems: "center" }}>
                                    <span className="repair-pay-bank-value">{req.engineer.accountNumber}</span>
                                    <button
                                      className="repair-pay-copy-btn"
                                      onClick={() => copyToClipboard(req.engineer.accountNumber, quote.id)}
                                      type="button"
                                    >
                                      {copiedFor === quote.id ? "Copied" : "Copy"}
                                    </button>
                                  </span>
                                </div>
                                <div className="repair-pay-bank-row">
                                  <span className="repair-pay-bank-label">Account Name</span>
                                  <span className="repair-pay-bank-value">{req.engineer.accountHolderName}</span>
                                </div>

                                <label className="repair-pay-form-label">Payment Reference / Transaction ID</label>
                                <input
                                  className="repair-pay-input"
                                  value={form.reference || ""}
                                  onChange={(e) => updateForm(quote.id, { reference: e.target.value })}
                                  placeholder="e.g. from your bank transfer receipt"
                                  disabled={form.submitting}
                                />

                                <input
                                  type="file"
                                  accept="image/*"
                                  ref={(el) => (fileInputRefs.current[quote.id] = el)}
                                  style={{ display: "none" }}
                                  onChange={(e) => handleUpload(quote.id, e.target.files?.[0])}
                                />
                                <button
                                  className="repair-pay-upload-btn"
                                  onClick={() => fileInputRefs.current[quote.id]?.click()}
                                  disabled={form.uploading}
                                  type="button"
                                >
                                  {form.uploading
                                    ? "Uploading..."
                                    : form.proofPath
                                    ? "Receipt Attached ✓ (tap to change)"
                                    : "Attach Receipt Photo (optional)"}
                                </button>

                                <button
                                  className="repair-pay-submit-btn"
                                  onClick={() => handleSubmitPayment(quote.id)}
                                  disabled={form.submitting}
                                  type="button"
                                >
                                  {form.submitting ? "Submitting..." : "I've Made This Payment"}
                                </button>

                                {form.error && <p className="repair-pay-error-text">{form.error}</p>}
                              </>
                            ) : (
                              <p className="repair-pay-error-text">
                                This engineer hasn't set up their payment details yet. Please contact support.
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {viewingImage && (
        <div
          onClick={() => setViewingImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10,9,8,0.92)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            cursor: "zoom-out",
          }}
        >
          <img
            src={viewingImage}
            alt="Printer full view"
            style={{
              maxWidth: "100%",
              maxHeight: "85vh",
              borderRadius: 10,
              border: "1px solid var(--gold-dark)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          />
          <button
            onClick={() => setViewingImage(null)}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff",
              borderRadius: "50%",
              width: 36,
              height: 36,
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
