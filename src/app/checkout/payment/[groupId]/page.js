"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

export default function CheckoutPaymentPage() {
  const { groupId } = useParams();
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formState, setFormState] = useState({});
  const [copiedFor, setCopiedFor] = useState(null);
  const fileInputRefs = useRef({});

  useEffect(() => {
    loadGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  async function loadGroup() {
    setLoading(true);
    try {
      const res = await fetch(`/api/checkout/group/${groupId}`);
      const data = await res.json();
      if (data.error) {
        setLoadError(data.error);
      } else {
        setOrders(data.orders);
        setFormState((prev) => {
          const next = { ...prev };
          data.orders.forEach((o) => {
            if (!next[o.orderId]) {
              next[o.orderId] = {
                reference: o.paymentReference || "",
                proofPath: o.proofImagePath || "",
                uploading: false,
                submitting: false,
                error: "",
              };
            }
          });
          return next;
        });
      }
    } catch (e) {
      setLoadError("Something went wrong loading your order.");
    }
    setLoading(false);
  }

  function updateForm(orderId, patch) {
    setFormState((prev) => ({ ...prev, [orderId]: { ...prev[orderId], ...patch } }));
  }

  async function handleUpload(orderId, file) {
    if (!file) return;
    updateForm(orderId, { uploading: true, error: "" });
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        updateForm(orderId, { proofPath: data.url, uploading: false });
      } else {
        updateForm(orderId, { uploading: false, error: "Upload failed. Please try again." });
      }
    } catch (e) {
      updateForm(orderId, { uploading: false, error: "Upload failed. Please try again." });
    }
  }

  async function handleSubmitPayment(orderId) {
    const form = formState[orderId];
    if (!form.reference || !form.reference.trim()) {
      updateForm(orderId, { error: "Please enter your payment reference or transaction ID." });
      return;
    }
    updateForm(orderId, { submitting: true, error: "" });
    try {
      const res = await fetch(`/api/orders/${orderId}/submit-payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentReference: form.reference, proofImagePath: form.proofPath }),
      });
      const data = await res.json();
      if (data.error) {
        updateForm(orderId, { submitting: false, error: data.error });
      } else {
        updateForm(orderId, { submitting: false });
        loadGroup();
      }
    } catch (e) {
      updateForm(orderId, { submitting: false, error: "Something went wrong. Please try again." });
    }
  }

  function formatNaira(amount) {
    return "₦" + Number(amount || 0).toLocaleString("en-NG");
  }

  function copyToClipboard(text, orderId) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedFor(orderId);
      setTimeout(() => setCopiedFor(null), 1500);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#1A1917", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#B8863B", fontFamily: "'Courier New', monospace", letterSpacing: 2 }}>Preparing your payment...</p>
      </div>
    );
  }

  if (loadError || !orders) {
    return (
      <div style={{ minHeight: "100vh", background: "#1A1917", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <p style={{ color: "#e08b7a", fontFamily: "'Courier New', monospace", textAlign: "center" }}>
          {loadError || "We couldn't find that order."}
        </p>
      </div>
    );
  }

  const allSubmittedOrPaid = orders.every(
    (o) => o.paymentStatus === "PAYMENT_SUBMITTED" || o.paymentStatus === "PAID"
  );

  return (
    <div className="pay-vault">
      <style>{`
      .pay-vault {
        min-height: 100vh;
        background: #1A1917;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 32px 16px 80px;
        font-family: Georgia, 'Times New Roman', serif;
      }
      .pay-eyebrow {
        color: #8F6829;
        font-family: 'Courier New', monospace;
        letter-spacing: 4px;
        font-size: 11px;
        text-transform: uppercase;
        margin-bottom: 8px;
        text-align: center;
      }
      .pay-heading {
        color: #F7F2E7;
        font-size: 24px;
        font-weight: 700;
        text-align: center;
        margin: 0 0 8px;
      }
      .pay-sub {
        color: #a89a7c;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        text-align: center;
        max-width: 380px;
        line-height: 1.6;
        margin: 0 0 16px;
      }
      .pay-split-badge {
        background: rgba(184,134,59,0.15);
        border: 1px solid #8F6829;
        color: #B8863B;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        letter-spacing: 1px;
        text-transform: uppercase;
        padding: 6px 14px;
        border-radius: 20px;
        margin-bottom: 28px;
      }
      .pay-card {
        background: #F7F2E7;
        width: 100%;
        max-width: 420px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        padding: 28px 24px 32px;
        margin-bottom: 24px;
        border-radius: 6px;
        position: relative;
      }
      .pay-shop-label {
        color: #8F6829;
        font-family: 'Courier New', monospace;
        font-size: 10px;
        letter-spacing: 3px;
        text-transform: uppercase;
        margin: 0 0 4px;
      }
      .pay-shop-name {
        color: #1F1B16;
        font-size: 19px;
        font-weight: 700;
        margin: 0 0 20px;
      }
      .pay-amount-label {
        font-family: 'Courier New', monospace;
        font-size: 11px;
        letter-spacing: 2px;
        color: #6b5f4f;
        text-transform: uppercase;
        margin: 0 0 4px;
      }
      .pay-amount-value {
        font-family: 'Courier New', monospace;
        font-size: 34px;
        font-weight: 700;
        color: #8F6829;
        letter-spacing: 0.5px;
        margin: 0 0 16px;
      }
      .pay-divider {
        border: none;
        border-top: 1px dashed #c9bfa8;
        margin: 18px 0;
      }
      .pay-bank-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        color: #1F1B16;
        padding: 7px 0;
      }
      .pay-bank-label {
        color: #6b5f4f;
        font-size: 11px;
        letter-spacing: 1px;
        text-transform: uppercase;
      }
      .pay-bank-value {
        font-weight: 700;
        letter-spacing: 1px;
      }
      .pay-copy-btn {
        background: none;
        border: 1px solid #B8863B;
        color: #8F6829;
        font-family: 'Courier New', monospace;
        font-size: 10px;
        letter-spacing: 1px;
        text-transform: uppercase;
        padding: 4px 10px;
        border-radius: 4px;
        cursor: pointer;
        margin-left: 8px;
      }
      .pay-copy-btn:active { opacity: 0.6; }
      .pay-status-banner {
        font-family: 'Courier New', monospace;
        font-size: 12px;
        text-align: center;
        padding: 12px;
        border-radius: 4px;
        margin-top: 18px;
        letter-spacing: 0.5px;
        line-height: 1.6;
      }
      .pay-status-submitted {
        background: rgba(184,134,59,0.12);
        border: 1px solid #B8863B;
        color: #8F6829;
      }
      .pay-status-confirmed {
        background: rgba(127,216,143,0.15);
        border: 1px solid #7fd88f;
        color: #3f7a4f;
      }
      .pay-status-rejected {
        background: rgba(224,139,122,0.12);
        border: 1px solid #e08b7a;
        color: #c0554f;
      }
      .pay-form-label {
        display: block;
        color: #8F6829;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        letter-spacing: 2px;
        text-transform: uppercase;
        margin: 18px 0 6px;
      }
      .pay-input {
        width: 100%;
        padding: 10px 12px;
        border-radius: 4px;
        border: 1px solid #B8863B;
        background: #fff;
        color: #1F1B16;
        font-size: 16px;
        font-family: 'Courier New', monospace;
        box-sizing: border-box;
      }
      .pay-upload-btn {
        width: 100%;
        margin-top: 10px;
        padding: 10px 12px;
        border-radius: 4px;
        border: 1px dashed #B8863B;
        background: none;
        color: #8F6829;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        letter-spacing: 1px;
        text-transform: uppercase;
        cursor: pointer;
      }
      .pay-upload-btn:disabled { opacity: 0.6; }
      .pay-submit-btn {
        width: 100%;
        margin-top: 18px;
        padding: 13px;
        border-radius: 4px;
        border: none;
        background: linear-gradient(135deg, #B8863B 0%, #8F6829 100%);
        color: #F7F2E7;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        letter-spacing: 1px;
        text-transform: uppercase;
        font-weight: 700;
        cursor: pointer;
      }
      .pay-submit-btn:disabled { opacity: 0.6; }
      .pay-error-text {
        color: #c0554f;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        margin: 8px 0 0;
        text-align: center;
      }
      .pay-item-line {
        display: flex;
        justify-content: space-between;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        color: #6b5f4f;
        padding: 3px 0;
      }
      .pay-done-banner {
        background: #F7F2E7;
        border-radius: 6px;
        padding: 28px 24px;
        text-align: center;
        max-width: 420px;
        width: 100%;
        margin-top: 4px;
      }
      .pay-done-title {
        color: #1F1B16;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 18px;
        font-weight: 700;
        margin: 0 0 8px;
      }
      .pay-done-sub {
        color: #6b5f4f;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.6;
        margin: 0 0 18px;
      }
      .pay-done-link {
        display: inline-block;
        background: linear-gradient(135deg, #B8863B 0%, #8F6829 100%);
        color: #F7F2E7;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        letter-spacing: 1px;
        text-transform: uppercase;
        padding: 11px 26px;
        border-radius: 4px;
        text-decoration: none;
      }
      `}</style>

      <p className="pay-eyebrow">Silverstar Treasury</p>
      <h1 className="pay-heading">Complete Your Payment</h1>
      <p className="pay-sub">
        Pay each shop directly using the bank details below, then submit your
        payment reference so the shop can confirm it and get your order moving.
      </p>
      {orders.length > 1 && (
        <div className="pay-split-badge">Your order is from {orders.length} shops</div>
      )}

      {orders.map((order) => {
        const form = formState[order.orderId] || {};
        const status = order.paymentStatus;

        return (
          <div className="pay-card" key={order.orderId}>
            {orders.length > 1 && <p className="pay-shop-label">Shop</p>}
            <p className="pay-shop-name">{order.vendor?.name || "Vendor"}</p>

            <p className="pay-amount-label">Amount to Pay</p>
            <p className="pay-amount-value">{formatNaira(order.totalAmount)}</p>

            {order.items.map((item, idx) => (
              <div className="pay-item-line" key={idx}>
                <span>
                  {item.title} × {item.quantity}
                </span>
                <span>{formatNaira(item.price * item.quantity)}</span>
              </div>
            ))}

            <hr className="pay-divider" />

            {order.vendor?.bankName ? (
              <>
                <div className="pay-bank-row">
                  <span className="pay-bank-label">Bank</span>
                  <span className="pay-bank-value">{order.vendor.bankName}</span>
                </div>
                <div className="pay-bank-row">
                  <span className="pay-bank-label">Account Number</span>
                  <span style={{ display: "flex", alignItems: "center" }}>
                    <span className="pay-bank-value">{order.vendor.accountNumber}</span>
                    <button
                      className="pay-copy-btn"
                      onClick={() => copyToClipboard(order.vendor.accountNumber, order.orderId)}
                      type="button"
                    >
                      {copiedFor === order.orderId ? "Copied" : "Copy"}
                    </button>
                  </span>
                </div>
                <div className="pay-bank-row">
                  <span className="pay-bank-label">Account Name</span>
                  <span className="pay-bank-value">{order.vendor.accountHolderName}</span>
                </div>
              </>
            ) : (
              <p style={{ color: "#c0554f", fontFamily: "'Courier New', monospace", fontSize: 12, textAlign: "center" }}>
                This shop hasn't set up their settlement account yet. Please contact support.
              </p>
            )}

            {status === "PAID" && (
              <div className="pay-status-banner pay-status-confirmed">
                ✓ Payment Confirmed by {order.vendor?.name}
              </div>
            )}

            {status === "PAYMENT_SUBMITTED" && (
              <div className="pay-status-banner pay-status-submitted">
                Payment Submitted — Awaiting Confirmation
                <br />
                Ref: {order.paymentReference}
              </div>
            )}

            {(status === "UNPAID" || status === "PAYMENT_REJECTED") && order.vendor?.bankName && (
              <>
                {status === "PAYMENT_REJECTED" && (
                  <div className="pay-status-banner pay-status-rejected">
                    Payment Rejected: {order.paymentRejectedReason || "Please check your details and resubmit."}
                  </div>
                )}

                <label className="pay-form-label">Payment Reference / Transaction ID</label>
                <input
                  className="pay-input"
                  value={form.reference || ""}
                  onChange={(e) => updateForm(order.orderId, { reference: e.target.value })}
                  placeholder="e.g. from your bank transfer receipt"
                  disabled={form.submitting}
                />

                <input
                  type="file"
                  accept="image/*"
                  ref={(el) => (fileInputRefs.current[order.orderId] = el)}
                  style={{ display: "none" }}
                  onChange={(e) => handleUpload(order.orderId, e.target.files?.[0])}
                />
                <button
                  className="pay-upload-btn"
                  onClick={() => fileInputRefs.current[order.orderId]?.click()}
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
                  className="pay-submit-btn"
                  onClick={() => handleSubmitPayment(order.orderId)}
                  disabled={form.submitting}
                  type="button"
                >
                  {form.submitting ? "Submitting..." : "I've Made This Payment"}
                </button>

                {form.error && <p className="pay-error-text">{form.error}</p>}
              </>
            )}
          </div>
        );
      })}

      {allSubmittedOrPaid && (
        <div className="pay-done-banner">
          <p className="pay-done-title">You're all set</p>
          <p className="pay-done-sub">
            We've notified {orders.length > 1 ? "each shop" : "the shop"} of your payment.
            You'll be able to track confirmation and delivery from your orders page.
          </p>
          <a href="/orders" className="pay-done-link">
            View My Orders
          </a>
        </div>
      )}
    </div>
  );
}
