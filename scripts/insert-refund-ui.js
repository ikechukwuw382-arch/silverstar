const fs = require('fs');
const path = process.argv[2];

if (!path) {
  console.error('Usage: node insert-refund-ui.js <path-to-page.js>');
  process.exit(1);
}

let content = fs.readFileSync(path, 'utf8');

// --- Insertion 1: new state, right after the cancel-order state ---
const stateAnchor = 'const [cancelError, setCancelError] = useState("");';
const stateAddition = `${stateAnchor}
  const [refundReason, setRefundReason] = useState("");
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [requestingRefund, setRequestingRefund] = useState(false);
  const [confirmingRefund, setConfirmingRefund] = useState(false);
  const [refundError, setRefundError] = useState("");`;

if (!content.includes(stateAnchor)) {
  console.error('Could not find state anchor line. Nothing changed.');
  process.exit(1);
}
if (content.includes('const [refundReason, setRefundReason]')) {
  console.log('Refund state already present — skipping that part.');
} else {
  content = content.replace(stateAnchor, stateAddition);
}

// --- Insertion 2: the refund UI block, right before the Items section ---
const itemsAnchor = '{/* Items */}';
const refundBlock = `{order.status !== "Order Placed" && order.status !== "Cancelled" && (
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
                    <button
                      onClick={async () => {
                        if (!refundReason.trim()) {
                          setRefundError("Please enter a reason.");
                          return;
                        }
                        setRequestingRefund(true);
                        setRefundError("");
                        try {
                          const res = await fetch(\`/api/orders/\${order.id}/request-refund\`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ reason: refundReason }),
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
                      const res = await fetch(\`/api/orders/\${order.id}/confirm-refund\`, { method: "POST" });
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
              <p style={{ color: "#2e7d32", fontWeight: 600 }}>Refund confirmed. \u2713</p>
            )}

            {refundError && (
              <p style={{ color: "#b00020", fontSize: 13, marginTop: 8 }}>{refundError}</p>
            )}
          </div>
        )}

        ${itemsAnchor}`;

if (!content.includes(itemsAnchor)) {
  console.error('Could not find Items anchor. Nothing changed.');
  process.exit(1);
}
if (content.includes('Request Refund')) {
  console.log('Refund UI already present — skipping that part.');
} else {
  content = content.replace(itemsAnchor, refundBlock);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done: refund UI inserted into ' + path);
