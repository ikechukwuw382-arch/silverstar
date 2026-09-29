"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

const statusOptions = [
  "Order Placed",
  "Confirmed",
  "Preparing",
  "Ready for Delivery",
  "Out for Delivery",
  "Delivered",
];

const paymentBadgeStyles = {
  UNPAID: { background: "rgba(228,224,216,0.15)", color: "#C9C4B8" },
  PAYMENT_SUBMITTED: { background: "rgba(64,120,192,0.18)", color: "#7FB3F0" },
  PAID: { background: "rgba(90,168,110,0.18)", color: "#7FCB94" },
  PAYMENT_REJECTED: { background: "rgba(200,80,80,0.18)", color: "#E38080" },
};

const paymentBadgeLabels = {
  UNPAID: "Awaiting Payment",
  PAYMENT_SUBMITTED: "Payment Submitted",
  PAID: "Payment Confirmed",
  PAYMENT_REJECTED: "Payment Rejected",
};

// vault-ledger palette
const GRAPHITE = "#1A1917";
const CREAM = "#F7F2E7";
const GOLD = "#B8863B";
const GOLD_DARK = "#8F6829";
const MONO = "'Courier New', monospace";

export default function VendorOrdersPage() {
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feeInputs, setFeeInputs] = useState({});
  const [rejectingOrderId, setRejectingOrderId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [paymentBusy, setPaymentBusy] = useState(null);
  const [paymentError, setPaymentError] = useState({});
  const [refundInputs, setRefundInputs] = useState({});
  const [refundBusy, setRefundBusy] = useState(null);
  const [refundErrors, setRefundErrors] = useState({});

  useEffect(() => {
    loadOrders();
  }, []);

  function loadOrders() {
    fetch("/api/vendor-orders")
      .then((res) => res.json())
      .then((data) => {
        setOrderItems(data.orderItems || []);
        setLoading(false);
      });
  }

  async function updateStatus(orderId, status) {
    const res = await fetch("/api/vendor-orders/update-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    const data = await res.json();
    if (res.ok) {
      loadOrders();
    } else {
      setPaymentError({ ...paymentError, [orderId]: data.error });
    }
  }

  async function submitDeliveryFee(orderId) {
    const fee = feeInputs[orderId];
    if (fee == null || fee === "") return;
    const res = await fetch("/api/vendor-orders/set-delivery-fee", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, deliveryFee: Number(fee) }),
    });
    if (res.ok) loadOrders();
  }

  async function reviewPayment(orderId, action, reason) {
    setPaymentBusy(orderId);
    setPaymentError({ ...paymentError, [orderId]: "" });
    try {
      const res = await fetch("/api/vendor-orders/confirm-payment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action, reason }),
      });
      const data = await res.json();
      if (data.error) {
        setPaymentError({ ...paymentError, [orderId]: data.error });
      } else {
        setRejectingOrderId(null);
        setRejectReason("");
        loadOrders();
      }
    } catch (e) {
      setPaymentError({ ...paymentError, [orderId]: "Something went wrong. Please try again." });
    }
    setPaymentBusy(null);
  }

  // Group the flat item list into one entry per order, in first-seen order.
  const groupedOrders = [];
  const groupIndex = {};
  for (const item of orderItems) {
    const orderId = item.order.id;
    if (!(orderId in groupIndex)) {
      groupIndex[orderId] = groupedOrders.length;
      groupedOrders.push({ order: item.order, items: [] });
    }
    groupedOrders[groupIndex[orderId]].items.push(item);
  }

  return (
    <div>
      <Navbar />
      <div style={{ background: GRAPHITE, minHeight: "100vh", paddingBottom: 60 }}>
        <div style={{ paddingTop: 40, maxWidth: 560, margin: "0 auto", padding: "40px 20px 60px" }}>
          <div
            style={{
              fontFamily: "Georgia, serif",
              color: GOLD,
              fontSize: 13,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Fulfillment Ledger
          </div>
          <h2
            style={{
              color: CREAM,
              fontFamily: "Georgia, serif",
              fontSize: 26,
              margin: "0 0 28px",
              fontWeight: 400,
            }}
          >
            Orders to Fulfill
          </h2>

          {loading && <p style={{ color: "#9C9689" }}>Loading orders...</p>}

          {!loading && groupedOrders.length === 0 && (
            <p style={{ color: "#9C9689" }}>No orders yet for your listings.</p>
          )}

          {groupedOrders.map((group) => {
            const paymentStatus = group.order.paymentStatus || "UNPAID";
            const badgeStyle = paymentBadgeStyles[paymentStatus] || paymentBadgeStyles.UNPAID;
            const badgeLabel = paymentBadgeLabels[paymentStatus] || paymentStatus;

            return (
              <div
                key={group.order.id}
                style={{
                  border: `1px solid ${GOLD_DARK}`,
                  borderRadius: 4,
                  padding: 20,
                  marginBottom: 16,
                  background: CREAM,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "center",
                    columnGap: 10,
                    rowGap: 6,
                    marginBottom: 4,
                  }}
                >
                  <strong style={{ fontFamily: MONO, color: GRAPHITE, fontSize: 15, whiteSpace: "nowrap" }}>
                    ORDER #{group.order.id.slice(-8).toUpperCase()}
                  </strong>
                  <span
                    style={{
                      background: "rgba(184,134,59,0.15)",
                      color: GOLD_DARK,
                      fontWeight: 600,
                      fontSize: 12,
                      padding: "2px 10px",
                      borderRadius: 999,
                      letterSpacing: "0.03em",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {group.order.status.toUpperCase()}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "center",
                    columnGap: 10,
                    rowGap: 6,
                    marginBottom: 10,
                  }}
                >
                  <span style={{ color: "#8A8578", fontSize: 12, fontFamily: MONO, whiteSpace: "nowrap" }}>
                    {new Date(group.order.createdAt).toLocaleString("en-NG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 10px",
                      borderRadius: 999,
                      letterSpacing: "0.03em",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      background:
                        paymentStatus === "PAID"
                          ? "rgba(90,140,90,0.15)"
                          : paymentStatus === "PAYMENT_SUBMITTED"
                          ? "rgba(64,120,192,0.15)"
                          : paymentStatus === "PAYMENT_REJECTED"
                          ? "rgba(200,80,80,0.15)"
                          : "rgba(107,98,88,0.15)",
                      color:
                        paymentStatus === "PAID"
                          ? "#2e7d4a"
                          : paymentStatus === "PAYMENT_SUBMITTED"
                          ? "#1565C0"
                          : paymentStatus === "PAYMENT_REJECTED"
                          ? "#a83a3a"
                          : "#6B6258",
                    }}
                  >
                    {badgeLabel.toUpperCase()}
                  </span>
                </div>

                <div style={{ borderTop: "1px dashed #D8D0BE", paddingTop: 10, marginBottom: 10 }}>
                  {group.items.map((item) => (
                    <p
                      key={item.id}
                      style={{
                        margin: "4px 0",
                        fontFamily: MONO,
                        fontSize: 14,
                        color: GRAPHITE,
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>{item.listing.title} × {item.quantity}</span>
                      <span>₦{(item.price * item.quantity).toLocaleString()}</span>
                    </p>
                  ))}
                </div>

                <p style={{ margin: "4px 0", color: "#6B6258", fontSize: 13 }}>
                  Deliver to: {group.order.fullName}, {group.order.city}, {group.order.state}
                </p>
                <p style={{ margin: "4px 0", color: "#6B6258", fontSize: 13 }}>
                  Phone:{" "}
                  <a href={`tel:${group.order.phone}`} style={{ color: GOLD_DARK, fontWeight: 600 }}>
                    {group.order.phone}
                  </a>
                </p>
                {group.order.instructions && (
                  <p style={{ margin: "4px 0", color: "#6B6258", fontSize: 13 }}>
                    Instructions: {group.order.instructions}
                  </p>
                )}

                {group.order.deliveryFee === 0 ? (
                  <div style={{ display: "flex", gap: 8, marginTop: 12, marginBottom: 4 }}>
                    <input
                      type="number"
                      placeholder="Set delivery fee (₦)"
                      value={feeInputs[group.order.id] ?? ""}
                      onChange={(e) =>
                        setFeeInputs({ ...feeInputs, [group.order.id]: e.target.value })
                      }
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        borderRadius: 4,
                        border: "1px solid #D8D0BE",
                        fontSize: 16,
                        fontFamily: MONO,
                        background: "#fff",
                      }}
                    />
                    <button
                      onClick={() => submitDeliveryFee(group.order.id)}
                      style={{
                        padding: "10px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        borderRadius: 4,
                        border: "none",
                        background: `linear-gradient(180deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`,
                        color: "#fff",
                        cursor: "pointer",
                        letterSpacing: "0.02em",
                      }}
                    >
                      Set Fee
                    </button>
                  </div>
                ) : (
                  <p style={{ margin: "8px 0 4px", color: "#6B6258", fontSize: 13, fontFamily: MONO }}>
                    Delivery Fee: ₦{group.order.deliveryFee.toLocaleString()}
                  </p>
                )}

                {/* Payment review section */}
                {paymentStatus === "PAYMENT_SUBMITTED" && (
                  <div
                    style={{
                      marginTop: 14,
                      padding: 14,
                      borderRadius: 4,
                      background: GRAPHITE,
                      border: `1px solid ${GOLD_DARK}`,
                    }}
                  >
                    <p style={{ margin: "0 0 6px", fontSize: 13, color: CREAM, fontFamily: MONO }}>
                      <span style={{ color: GOLD }}>REFERENCE:</span> {group.order.paymentReference}
                    </p>
                    {group.order.proofImagePath && (
                      <a
                        href={group.order.proofImagePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: GOLD, fontSize: 13, fontWeight: 600 }}
                      >
                        View Receipt →
                      </a>
                    )}

                    {rejectingOrderId === group.order.id ? (
                      <div style={{ marginTop: 12 }}>
                        <input
                          type="text"
                          placeholder="Reason for rejecting this payment"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          disabled={paymentBusy === group.order.id}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 4,
                            border: "1px solid #4A473F",
                            fontSize: 16,
                            boxSizing: "border-box",
                            marginBottom: 10,
                            background: "#252420",
                            color: CREAM,
                          }}
                        />
                        <div style={{ display: "flex", gap: 10 }}>
                          <button
                            onClick={() => reviewPayment(group.order.id, "reject", rejectReason)}
                            disabled={paymentBusy === group.order.id || !rejectReason.trim()}
                            style={{
                              padding: "9px 16px",
                              fontSize: 13,
                              fontWeight: 600,
                              borderRadius: 4,
                              border: "none",
                              background: `linear-gradient(180deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`,
                              color: "#fff",
                              cursor: "pointer",
                              opacity: !rejectReason.trim() ? 0.5 : 1,
                            }}
                          >
                            {paymentBusy === group.order.id ? "..." : "Confirm Reject"}
                          </button>
                          <button
                            onClick={() => {
                              setRejectingOrderId(null);
                              setRejectReason("");
                            }}
                            disabled={paymentBusy === group.order.id}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#9C9689",
                              fontSize: 13,
                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                        <button
                          onClick={() => reviewPayment(group.order.id, "confirm")}
                          disabled={paymentBusy === group.order.id}
                          style={{
                            padding: "9px 16px",
                            fontSize: 13,
                            fontWeight: 600,
                            borderRadius: 4,
                            border: "none",
                            background: `linear-gradient(180deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`,
                            color: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          {paymentBusy === group.order.id ? "..." : "Confirm Payment"}
                        </button>
                        <button
                          onClick={() => setRejectingOrderId(group.order.id)}
                          disabled={paymentBusy === group.order.id}
                          style={{
                            background: "none",
                            border: "1px solid #C87A7A",
                            color: "#E38080",
                            borderRadius: 4,
                            fontSize: 13,
                            padding: "9px 16px",
                            cursor: "pointer",
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {paymentStatus === "PAYMENT_REJECTED" && group.order.paymentRejectedReason && (
                  <p style={{ margin: "10px 0 0", color: "#a83a3a", fontSize: 13 }}>
                    You rejected this payment: {group.order.paymentRejectedReason}
                  </p>
                )}

                {paymentError[group.order.id] && (
                  <p style={{ margin: "10px 0 0", color: "#a83a3a", fontSize: 13 }}>
                    {paymentError[group.order.id]}
                  </p>
                )}

                {group.order.refund && group.order.refund.status === "REQUESTED" && (
              <div style={{ marginTop: 14, padding: 12, border: "1px solid #E4C97A", borderRadius: 6, background: "#FFFBEF" }}>
                <p style={{ margin: "0 0 8px 0", fontWeight: 600, fontSize: 14 }}>
                  Refund requested: "{group.order.refund.reason}"
                </p>
                <p style={{ margin: "0 0 8px 0", fontSize: 14 }}>
                  Send to: <strong>{group.order.refund.refundAccountName}</strong>
                  {" — "}{group.order.refund.refundBankName}
                  {" — "}{group.order.refund.refundAccountNo}
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setRefundInputs((prev) => ({
                      ...prev,
                      [group.order.id]: { ...prev[group.order.id], uploading: true },
                    }));
                    try {
                      const formData = new FormData();
                      formData.append("file", file);
                      const res = await fetch("/api/upload", { method: "POST", body: formData });
                      const data = await res.json();
                      setRefundInputs((prev) => ({
                        ...prev,
                        [group.order.id]: {
                          ...prev[group.order.id],
                          receiptImagePath: data.url || null,
                          uploading: false,
                        },
                      }));
                    } catch (err) {
                      setRefundInputs((prev) => ({
                        ...prev,
                        [group.order.id]: { ...prev[group.order.id], uploading: false },
                      }));
                    }
                  }}
                  style={{ marginBottom: 8, fontSize: 13 }}
                />
                {refundInputs[group.order.id]?.uploading && (
                  <p style={{ fontSize: 12, color: "#8a6d00" }}>Uploading receipt...</p>
                )}
                {refundInputs[group.order.id]?.receiptImagePath && (
                  <p style={{ fontSize: 12, color: "#2e7d32" }}>Receipt attached ✓</p>
                )}
                <input
                  type="text"
                  placeholder="Bank transfer reference"
                  value={refundInputs[group.order.id]?.bankReference || ""}
                  onChange={(e) =>
                    setRefundInputs({
                      ...refundInputs,
                      [group.order.id]: { ...refundInputs[group.order.id], bankReference: e.target.value },
                    })
                  }
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 4, border: "1px solid #D8D0BE", marginBottom: 8, fontSize: 14 }}
                />
                <button
                  onClick={async () => {
                    const bankReference = refundInputs[group.order.id]?.bankReference || "";
                    if (!bankReference.trim()) {
                      setRefundErrors({ ...refundErrors, [group.order.id]: "Bank reference is required." });
                      return;
                    }
                    setRefundBusy(group.order.id);
                    setRefundErrors({ ...refundErrors, [group.order.id]: null });
                    try {
                      const res = await fetch(`/api/vendor/refunds/${group.order.id}/submit`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          bankReference,
                          receiptImagePath: refundInputs[group.order.id]?.receiptImagePath || null,
                        }),
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        setRefundErrors({ ...refundErrors, [group.order.id]: data.error || "Could not submit refund" });
                      } else {
                        setOrderItems((prev) =>
                          prev.map((it) =>
                            it.order.id === group.order.id
                              ? { ...it, order: { ...it.order, refund: { ...it.order.refund, status: "SUBMITTED" } } }
                              : it
                          )
                        );
                      }
                    } catch (err) {
                      setRefundErrors({ ...refundErrors, [group.order.id]: "Something went wrong" });
                    } finally {
                      setRefundBusy(null);
                    }
                  }}
                  disabled={refundBusy === group.order.id}
                  style={{
                    background: "#B8860B",
                    border: "none",
                    color: "#fff",
                    borderRadius: 4,
                    padding: "8px 14px",
                    fontWeight: 600,
                    cursor: refundBusy === group.order.id ? "not-allowed" : "pointer",
                  }}
                >
                  {refundBusy === group.order.id ? "Submitting..." : "Submit Refund"}
                </button>
                {refundErrors[group.order.id] && (
                  <p style={{ color: "#b00020", fontSize: 13, marginTop: 6 }}>{refundErrors[group.order.id]}</p>
                )}
              </div>
            )}

            {group.order.refund && group.order.refund.status === "SUBMITTED" && (
              <p style={{ marginTop: 10, color: "#8a6d00", fontWeight: 600, fontSize: 14 }}>
                Refund sent — waiting on customer confirmation.
              </p>
            )}

            {group.order.refund && group.order.refund.status === "CONFIRMED" && (
              <p style={{ marginTop: 10, color: "#2e7d32", fontWeight: 600, fontSize: 14 }}>
                Refund confirmed by customer.
              </p>
            )}

            <select
                  value={group.order.status}
                  onChange={(e) => updateStatus(group.order.id, e.target.value)}
                  style={{
                    marginTop: 14,
                    padding: "9px 12px",
                    borderRadius: 4,
                    border: "1px solid #D8D0BE",
                    fontSize: 14,
                    fontFamily: MONO,
                    background: "#fff",
                    color: GRAPHITE,
                  }}
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
