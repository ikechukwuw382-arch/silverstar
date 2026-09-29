"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

const statusOptions = ["On the Way", "Diagnosing", "Repairing", "Completed"];

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

export default function ServiceJobsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quoteForm, setQuoteForm] = useState({});
  const [viewingImage, setViewingImage] = useState(null);
  const [rejectingFor, setRejectingFor] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [paymentBusy, setPaymentBusy] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  function loadRequests() {
    fetch("/api/service-requests/vendor")
      .then((res) => res.json())
      .then((data) => {
        setRequests(data.requests || []);
        setLoading(false);
      });
  }

  async function acceptRequest(requestId) {
    const res = await fetch("/api/service-requests/accept", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });
    if (res.ok) loadRequests();
  }

  async function updateStatus(requestId, status) {
    const res = await fetch("/api/service-requests/update-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, status }),
    });
    const data = await res.json();
    if (res.ok) {
      loadRequests();
    } else {
      alert(data.error || "Something went wrong.");
    }
  }

  function updateQuoteField(requestId, field, value) {
    setQuoteForm({
      ...quoteForm,
      [requestId]: { ...quoteForm[requestId], [field]: value },
    });
  }

  async function submitQuote(requestId) {
    const form = quoteForm[requestId];
    if (!form?.diagnosis || form?.partsCost == null || form?.labourCost == null) return;

    const res = await fetch("/api/service-requests/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId,
        diagnosis: form.diagnosis,
        partsCost: form.partsCost,
        labourCost: form.labourCost,
      }),
    });
    if (res.ok) loadRequests();
  }

  async function confirmPayment(quoteId) {
    setPaymentBusy(quoteId);
    const res = await fetch("/api/service-requests/quote/confirm-payment", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteId, action: "confirm" }),
    });
    const data = await res.json();
    setPaymentBusy(null);
    if (res.ok) {
      loadRequests();
    } else {
      alert(data.error || "Something went wrong.");
    }
  }

  async function rejectPayment(quoteId) {
    if (!rejectReason.trim()) {
      alert("Please explain why you're rejecting this payment.");
      return;
    }
    setPaymentBusy(quoteId);
    const res = await fetch("/api/service-requests/quote/confirm-payment", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteId, action: "reject", reason: rejectReason }),
    });
    const data = await res.json();
    setPaymentBusy(null);
    if (res.ok) {
      setRejectingFor(null);
      setRejectReason("");
      loadRequests();
    } else {
      alert(data.error || "Something went wrong.");
    }
  }

  return (
    <div>
      <Navbar />
      <div className="section" style={{ paddingTop: 28, paddingBottom: 40, maxWidth: 560, margin: "0 auto" }}>
        <p style={{ color: "var(--gold)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
          Field Service
        </p>
        <h2 className="card-title" style={{ marginBottom: 26 }}>Service Requests</h2>

        {loading && <p className="message">Loading requests...</p>}
        {!loading && requests.length === 0 && (
          <p className="message">No service requests available.</p>
        )}

        {requests.map((req) => {
          const stageIndex = getStageIndex(req.status);
          const isUnassigned = !req.engineerId;
          const paymentStatus = req.quote?.paymentStatus || "UNPAID";

          return (
            <div key={req.id} className="ticket-card">
              <div className="ticket-zigzag" />
              <div className="ticket-body">
                <div className="ticket-header">
                  <span className="ticket-number">{req.requestNumber}</span>
                  <span className="ticket-date">
                    {new Date(req.createdAt).toLocaleString("en-NG", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {isUnassigned ? (
                  <span className="ticket-status-label">Unassigned — Awaiting Acceptance</span>
                ) : (
                  <>
                    <div className="ticket-stepper">
                      {stageBuckets.map((stage, i) => (
                        <div key={stage.label} style={{ display: "flex", alignItems: "center", flex: i < stageBuckets.length - 1 ? 1 : "0 0 auto" }}>
                          <div className={"ticket-stepper-dot" + (i < stageIndex ? " done" : i === stageIndex ? " active" : "")} />
                          {i < stageBuckets.length - 1 && (
                            <div className={"ticket-stepper-line" + (i < stageIndex ? " done" : "")} />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="ticket-stepper-labels">
                      {stageBuckets.map((stage, i) => (
                        <span key={stage.label} className={i === stageIndex ? "active" : ""}>{stage.label}</span>
                      ))}
                    </div>
                    <span className="ticket-status-label">{req.status}</span>
                  </>
                )}

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
                {req.additionalInfo && (
                  <p className="ticket-problem" style={{ marginTop: -8 }}>
                    Additional info: {req.additionalInfo}
                  </p>
                )}

                <p style={{ color: "var(--silver)", opacity: 0.85, fontSize: 13.5, margin: "4px 0" }}>
                  {req.customer?.name} ·{" "}
                  <a href={`tel:${req.phone}`} style={{ color: "var(--gold)", fontWeight: 600 }}>
                    {req.phone}
                  </a>
                </p>
                <p style={{ color: "var(--silver)", opacity: 0.7, fontSize: 13, margin: "0 0 6px" }}>
                  {req.address}, {req.city}, {req.state}
                </p>

                {isUnassigned && (
                  <button onClick={() => acceptRequest(req.id)} className="auth-btn" style={{ marginTop: 10 }}>
                    Accept Request
                  </button>
                )}

                {!isUnassigned && req.status !== "Completed" && (
                  <>
                    <label className="auth-field-label" style={{ marginTop: 16 }}>Update Status</label>
                    <select
                      value={req.status}
                      onChange={(e) => updateStatus(req.id, e.target.value)}
                      className="auth-input"
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>

                    {!req.quote && (
                      <div className="auth-subcard">
                        <h3 className="auth-subcard-title">Submit Quote</h3>
                        <textarea
                          placeholder="Diagnosis — what's wrong with it?"
                          value={quoteForm[req.id]?.diagnosis || ""}
                          onChange={(e) => updateQuoteField(req.id, "diagnosis", e.target.value)}
                          className="auth-input"
                          style={{ minHeight: 70, fontFamily: "inherit", marginBottom: 12 }}
                        />
                        <div style={{ display: "flex", gap: 10 }}>
                          <input
                            type="number"
                            placeholder="Parts Cost (₦)"
                            value={quoteForm[req.id]?.partsCost || ""}
                            onChange={(e) => updateQuoteField(req.id, "partsCost", e.target.value)}
                            className="auth-input"
                          />
                          <input
                            type="number"
                            placeholder="Labour Cost (₦)"
                            value={quoteForm[req.id]?.labourCost || ""}
                            onChange={(e) => updateQuoteField(req.id, "labourCost", e.target.value)}
                            className="auth-input"
                          />
                        </div>
                        <button onClick={() => submitQuote(req.id)} className="auth-btn">
                          Submit Quote
                        </button>
                      </div>
                    )}

                    {req.quote && (
                      <div className="ticket-receipt">
                        <div className="ticket-receipt-title">
                          <span>Your Quote</span>
                          <span className={`auth-status-badge ${quoteStatusClass[req.quote.status] || "auth-status-pending"}`}>
                            {req.quote.status}
                          </span>
                        </div>
                        <p className="ticket-receipt-diagnosis">"{req.quote.diagnosis}"</p>
                        <div className="ticket-receipt-row">
                          <span>Parts</span>
                          <span>₦{req.quote.partsCost.toLocaleString()}</span>
                        </div>
                        <div className="ticket-receipt-row">
                          <span>Labour</span>
                          <span>₦{req.quote.labourCost.toLocaleString()}</span>
                        </div>
                        <div className="ticket-receipt-total">
                          <span>Total</span>
                          <span>₦{req.quote.totalCost.toLocaleString()}</span>
                        </div>

                        {req.quote.status === "Accepted" && paymentStatus === "PAYMENT_SUBMITTED" && (
                          <div className="repair-pay-wrap">
                            <div className="repair-pay-status-banner repair-pay-status-submitted">
                              Customer Says They've Paid
                            </div>
                            <div className="repair-pay-bank-row">
                              <span className="repair-pay-bank-label">Reference</span>
                              <span className="repair-pay-bank-value">{req.quote.paymentReference}</span>
                            </div>
                            {req.quote.proofImagePath && (
                              <img
                                src={req.quote.proofImagePath}
                                alt="Payment proof"
                                className="repair-pay-proof-thumb"
                                onClick={() => setViewingImage(req.quote.proofImagePath)}
                              />
                            )}

                            {rejectingFor === req.quote.id ? (
                              <>
                                <textarea
                                  className="repair-pay-input"
                                  style={{ marginTop: 10, minHeight: 60, fontFamily: "inherit" }}
                                  placeholder="Why are you rejecting this payment?"
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                />
                                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                                  <button
                                    className="repair-pay-submit-btn"
                                    style={{ margin: 0, background: "linear-gradient(135deg, #c0554f 0%, #A6453F 100%)" }}
                                    onClick={() => rejectPayment(req.quote.id)}
                                    disabled={paymentBusy === req.quote.id}
                                  >
                                    Confirm Rejection
                                  </button>
                                  <button
                                    className="auth-btn-secondary"
                                    style={{ margin: 0, flex: 1 }}
                                    onClick={() => { setRejectingFor(null); setRejectReason(""); }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                                <button
                                  className="repair-pay-submit-btn"
                                  style={{ margin: 0 }}
                                  onClick={() => confirmPayment(req.quote.id)}
                                  disabled={paymentBusy === req.quote.id}
                                >
                                  {paymentBusy === req.quote.id ? "Confirming..." : "Confirm Payment"}
                                </button>
                                <button
                                  className="auth-btn-secondary"
                                  style={{ margin: 0, flex: 1, borderColor: "#c0554f", color: "#e08b7a" }}
                                  onClick={() => setRejectingFor(req.quote.id)}
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {req.quote.status === "Accepted" && paymentStatus === "PAID" && (
                          <div className="repair-pay-status-banner repair-pay-status-confirmed" style={{ marginTop: 14 }}>
                            ✓ Payment Confirmed — you can begin repair work
                          </div>
                        )}

                        {req.quote.status === "Accepted" && paymentStatus === "UNPAID" && (
                          <p style={{ color: "var(--silver)", opacity: 0.7, fontSize: 12.5, marginTop: 10 }}>
                            Waiting for the customer to make payment.
                          </p>
                        )}
                      </div>
                    )}
                  </>
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
            alt="Full view"
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
