const fs = require('fs');
const path = process.argv[2];

if (!path) {
  console.error('Usage: node insert-vendor-refund-ui.js <path-to-vendor-orders-page.js>');
  process.exit(1);
}

let content = fs.readFileSync(path, 'utf8');

// --- Insertion 1: new state, right after paymentError state ---
const stateAnchor = 'const [paymentError, setPaymentError] = useState({});';
const stateAddition = `${stateAnchor}
  const [refundInputs, setRefundInputs] = useState({});
  const [refundBusy, setRefundBusy] = useState(null);
  const [refundErrors, setRefundErrors] = useState({});`;

if (!content.includes(stateAnchor)) {
  console.error('Could not find state anchor line. Nothing changed.');
  process.exit(1);
}
if (content.includes('const [refundInputs, setRefundInputs]')) {
  console.log('Refund state already present — skipping that part.');
} else {
  content = content.replace(stateAnchor, stateAddition);
}

// --- Insertion 2: the refund UI block, right before the status <select> ---
const selectAnchor = `<select`;
const refundBlock = `{group.order.refund && group.order.refund.status === "REQUESTED" && (
              <div style={{ marginTop: 14, padding: 12, border: "1px solid #E4C97A", borderRadius: 6, background: "#FFFBEF" }}>
                <p style={{ margin: "0 0 8px 0", fontWeight: 600, fontSize: 14 }}>
                  Refund requested: "{group.order.refund.reason}"
                </p>
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
                      const res = await fetch(\`/api/vendor/refunds/\${group.order.id}/submit\`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ bankReference }),
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
                Refund sent \u2014 waiting on customer confirmation.
              </p>
            )}

            {group.order.refund && group.order.refund.status === "CONFIRMED" && (
              <p style={{ marginTop: 10, color: "#2e7d32", fontWeight: 600, fontSize: 14 }}>
                Refund confirmed by customer.
              </p>
            )}

            ${selectAnchor}`;

if (!content.includes(selectAnchor)) {
  console.error('Could not find <select> anchor. Nothing changed. Check indentation matches exactly.');
  process.exit(1);
}
if (content.includes('Submit Refund')) {
  console.log('Vendor refund UI already present — skipping that part.');
} else {
  content = content.replace(selectAnchor, refundBlock);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done: vendor refund UI inserted into ' + path);
