"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";

const statusSteps = [
  "Order Placed",
  "Confirmed",
  "Preparing",
  "Ready for Delivery",
  "Out for Delivery",
  "Delivered",
];

function StarPicker({ value, onChange }) {
  return (
    <span style={{ display: "inline-flex", gap: "4px" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={() => onChange(n)}
          style={{
            fontSize: "26px",
            cursor: "pointer",
            color: n <= value ? "#B8860B" : "#E4E0D8",
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function ReviewForm({ item, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  async function handleSubmit() {
    if (rating < 1) {
      setError("Please select a star rating.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderItemId: item.id, rating, comment }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        onSubmitted(item.id);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          background: "none",
          border: "1px solid #B8860B",
          color: "#B8860B",
          borderRadius: 6,
          padding: "6px 12px",
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        ★ Leave a Review
      </button>
    );
  }

  return (
    <div
      style={{
        marginTop: 10,
        padding: 14,
        background: "#FAF7F2",
        borderRadius: 10,
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <StarPicker value={rating} onChange={setRating} />
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience with this product (optional)"
        rows={3}
        style={{
          width: "100%",
          border: "1px solid #E4E0D8",
          borderRadius: 8,
          padding: 8,
          fontSize: 14,
          fontFamily: "inherit",
          resize: "vertical",
          boxSizing: "border-box",
        }}
      />
      {error && (
        <p style={{ color: "#c0392b", fontSize: 13, margin: "6px 0" }}>{error}</p>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            background: "#B8860B",
            color: "#FAF7F2",
            border: "none",
            borderRadius: 6,
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            cursor: submitting ? "default" : "pointer",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
        <button
          onClick={() => setOpen(false)}
          style={{
            background: "none",
            border: "none",
            color: "#999",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const justPlaced = searchParams.get("justPlaced") === "true";
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewedIds, setReviewedIds] = useState([]);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [refundReason, setRefundReason] = useState("");
const [refundBankName, setRefundBankName] = useState("");
  const [refundAccountName, setRefundAccountName] = useState("");
  const [refundAccountNo, setRefundAccountNo] = useState("");
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [requestingRefund, setRequestingRefund] = useState(false);
  const [confirmingRefund, setConfirmingRefund] = useState(false);
  const [refundError, setRefundError] = useState("");

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setOrder(data.order);
        }
        setLoading(false);
      });
  }, [id]);

  function handleReviewed(itemId) {
    setReviewedIds((prev) => [...prev, itemId]);
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <p className="message" style={{ padding: 24 }}>Loading order...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <p className="message" style={{ padding: 24 }}>{error}</p>
      </div>
    );
  }

  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <div>
      <Navbar />
      <div className="section" style={{ paddingTop: 24, maxWidth: 520, margin: "0 auto" }}>
        {justPlaced && (
          <div
            style={{
              background: "#E8F5E9",
              border: "1px solid #A5D6A7",
              borderRadius: 12,
              padding: "16px 18px",
              marginBottom: 20,
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>✓</span>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: "#1b5e20", fontSize: 16 }}>
                Order placed successfully!
              </p>
              <p style={{ margin: "4px 0 0 0", color: "#2e7d32", fontSize: 13 }}>
                We've received your order and the vendor will confirm delivery details shortly. You can track its progress right here.
              </p>
            </div>
          </div>
        )}
        <h2 className="card-title" style={{ marginBottom: 4 }}>
          Order #{order.id.slice(-8).toUpperCase()}
        </h2>
        <p style={{ color: "#6b6b6b", marginBottom: 24 }}>
          Placed on {new Date(order.createdAt).toLocaleDateString()}
        </p>

        {/* Status Tracker */}
        <div style={{ marginBottom: 28 }}>
          {statusSteps.map((step, i) => (
            <div key={step} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: i <= currentStepIndex ? "#B8860B" : "#E4E0D8",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: i <= currentStepIndex ? "#1a1a1a" : "#a0a0a0",
                  fontWeight: i === currentStepIndex ? 600 : 400,
                }}
              >
                {step}
              </span>
            </div>
          ))}
        </div>

        {order.status === "Order Placed" && (
          <div style={{ marginBottom: 24 }}>
            <button
              onClick={async () => {
                if (!confirm("Cancel this order?")) return;
                setCancelling(true);
                setCancelError("");
                try {
                  const res = await fetch(`/api/orders/${order.id}/cancel`, { method: "POST" });
                  const data = await res.json();
                  if (!res.ok) {
                    setCancelError(data.error || "Could not cancel order");
                  } else {
                    setOrder({ ...order, status: "Cancelled" });
                  }
                } catch (err) {
                  setCancelError("Something went wrong");
                } finally {
                  setCancelling(false);
                }
              }}
              disabled={cancelling}
              style={{
                background: "#fff",
                border: "1px solid #B8860B",
                color: "#B8860B",
                borderRadius: 8,
                padding: "10px 16px",
                fontWeight: 600,
                cursor: cancelling ? "not-allowed" : "pointer",
              }}
            >
              {cancelling ? "Cancelling..." : "Cancel Order"}
            </button>
            {cancelError && (
              <p style={{ color: "#b00020", fontSize: 13, marginTop: 8 }}>{cancelError}</p>
            )}
          </div>
        )}

        {order.status !== "Order Placed" && order.status !== "Cancelled" && (
          <div style={{ marginBottom: 24 }}>
            {!order.refund && (
              <>
                {!showRefundForm ? (
                  <button
                    onClick={() => setShowRefundForm(true)}
                    style={{
                      background: "#fff",
                      border: "1px solid #B8860B",
                      color: "#B8860B",
                      borderRadius: 8,
                      padding: "10px 16px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Request Refund
                  </button>
                ) : (
                  <div style={{ marginTop: 8 }}>
                    <textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Tell us why you want a refund"
                      rows={3}
                      style={{
                        width: "100%",
                        padding: 10,
                        borderRadius: 8,
                        border: "1px solid #ccc",
                        marginBottom: 8,
                        fontFamily: "inherit",
                      }}
                    />
<input
                      type="text"
                      placeholder="Bank name"
                      value={refundBankName}
                      onChange={(e) => setRefundBankName(e.target.value)}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc", marginBottom: 8 }}
                    />
                    <input
                      type="text"
                      placeholder="Account name"
                      value={refundAccountName}
                      onChange={(e) => setRefundAccountName(e.target.value)}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc", marginBottom: 8 }}
                    />
                    <input
                      type="text"
                      placeholder="Account number"
                      value={refundAccountNo}
                      onChange={(e) => setRefundAccountNo(e.target.value)}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc", marginBottom: 8 }}
                    />
                    <button
                      onClick={async () => {
                        if (!refundReason.trim()) {
                          setRefundError("Please enter a reason.");
                          return;
                        }
                        setRequestingRefund(true);
                        setRefundError("");
                        try {
                          const res = await fetch(`/api/orders/${order.id}/request-refund`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
body: JSON.stringify({
                              reason: refundReason,
                              bankName: refundBankName,
                              accountName: refundAccountName,
                              accountNo: refundAccountNo,
                            }),
                          });
                          const data = await res.json();
                          if (!res.ok) {
                            setRefundError(data.error || "Could not request refund");
                          } else {
                            setOrder({
                              ...order,
                              refundStatus: "REQUESTED",
                              refund: { status: "REQUESTED", reason: refundReason },
                            });
                            setShowRefundForm(false);
                          }
                        } catch (err) {
                          setRefundError("Something went wrong");
                        } finally {
                          setRequestingRefund(false);
                        }
                      }}
                      disabled={requestingRefund}
                      style={{
                        background: "#B8860B",
                        border: "none",
                        color: "#fff",
                        borderRadius: 8,
                        padding: "10px 16px",
                        fontWeight: 600,
                        cursor: requestingRefund ? "not-allowed" : "pointer",
                      }}
                    >
                      {requestingRefund ? "Submitting..." : "Submit Refund Request"}
                    </button>
                  </div>
                )}
              </>
            )}

            {order.refund && order.refund.status === "REQUESTED" && (
              <p style={{ color: "#8a6d00", fontWeight: 600 }}>Refund requested — waiting on the seller.</p>
            )}

            {order.refund && order.refund.status === "SUBMITTED" && (
              <div>
                <p style={{ color: "#8a6d00", fontWeight: 600, marginBottom: 8 }}>
                  The seller says your refund has been sent. Please confirm once you see it in your account.
                </p>
                <button
                  onClick={async () => {
                    setConfirmingRefund(true);
                    setRefundError("");
                    try {
                      const res = await fetch(`/api/orders/${order.id}/confirm-refund`, { method: "POST" });
                      const data = await res.json();
                      if (!res.ok) {
                        setRefundError(data.error || "Could not confirm refund");
                      } else {
                        setOrder({
                          ...order,
                          refundStatus: "CONFIRMED",
                          refund: { ...order.refund, status: "CONFIRMED" },
                        });
                      }
                    } catch (err) {
                      setRefundError("Something went wrong");
                    } finally {
                      setConfirmingRefund(false);
                    }
                  }}
                  disabled={confirmingRefund}
                  style={{
                    background: "#B8860B",
                    border: "none",
                    color: "#fff",
                    borderRadius: 8,
                    padding: "10px 16px",
                    fontWeight: 600,
                    cursor: confirmingRefund ? "not-allowed" : "pointer",
                  }}
                >
                  {confirmingRefund ? "Confirming..." : "Confirm Refund Received"}
                </button>
              </div>
            )}

            {order.refund && order.refund.status === "CONFIRMED" && (
              <p style={{ color: "#2e7d32", fontWeight: 600 }}>Refund confirmed. ✓</p>
            )}

            {refundError && (
              <p style={{ color: "#b00020", fontSize: 13, marginTop: 8 }}>{refundError}</p>
            )}
          </div>
        )}

        {/* Items */}
        <h3 style={{ marginBottom: 12 }}>Items</h3>
        {order.items.map((item) => {
          const isDelivered = order.status === "Delivered";
          const hasReview = !!item.review || reviewedIds.includes(item.id);

          return (
            <div
              key={item.id}
              style={{
                padding: "10px 0",
                borderBottom: "1px solid #E4E0D8",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{item.listing.title} × {item.quantity}</span>
                <span>₦{(item.price * item.quantity).toLocaleString()}</span>
              </div>

              {isDelivered && (
                <div style={{ marginTop: 8 }}>
                  {hasReview ? (
                    <span style={{ color: "#2e7d32", fontSize: 13 }}>
                      ✓ You reviewed this
                    </span>
                  ) : (
                    <ReviewForm item={item} onSubmitted={handleReviewed} />
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div style={{ marginTop: 16, marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#6b6b6b" }}>Subtotal</span>
            <span style={{ color: "#6b6b6b" }}>₦{order.subtotal.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ color: "#6b6b6b" }}>Delivery Fee</span>
            <span style={{ color: "#6b6b6b" }}>
              {order.deliveryFee > 0
                ? `₦${order.deliveryFee.toLocaleString()}`
                : "Pending vendor confirmation"}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px solid #E4E0D8",
              paddingTop: 10,
            }}
          >
            <h3 style={{ margin: 0 }}>Total</h3>
            <h3 style={{ margin: 0 }}>₦{order.totalAmount.toLocaleString()}</h3>
          </div>
        </div>

        {/* Delivery Info */}
        <h3 style={{ marginBottom: 12 }}>Delivery Details</h3>
        <div style={{ background: "#fff", border: "1px solid #E4E0D8", borderRadius: 12, padding: 16 }}>
          <p style={{ margin: "4px 0" }}>{order.fullName}</p>
          <p style={{ margin: "4px 0" }}>{order.phone}</p>
          <p style={{ margin: "4px 0" }}>{order.address}, {order.city}, {order.state}</p>
          {order.instructions && (
            <p style={{ margin: "4px 0", color: "#6b6b6b" }}>Note: {order.instructions}</p>
          )}
        </div>
      </div>
    </div>
  );
}
