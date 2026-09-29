const fs = require('fs');
const path = process.argv[2];

if (!path) {
  console.error('Usage: node add-refund-bank-and-receipt.js <path-to-vendor-orders-page.js>');
  process.exit(1);
}

let content = fs.readFileSync(path, 'utf8');

// --- Insertion 1: show the customer's bank details, right after the reason line ---
const reasonAnchor = `Refund requested: "{group.order.refund.reason}"
                </p>`;
const bankDetailsBlock = `Refund requested: "{group.order.refund.reason}"
                </p>
                <p style={{ margin: "0 0 8px 0", fontSize: 14 }}>
                  Send to: <strong>{group.order.refund.refundAccountName}</strong>
                  {" \u2014 "}{group.order.refund.refundBankName}
                  {" \u2014 "}{group.order.refund.refundAccountNo}
                </p>`;

if (!content.includes(reasonAnchor)) {
  console.error('Could not find reason anchor. Nothing changed.');
  process.exit(1);
}
if (content.includes('Send to: <strong>')) {
  console.log('Bank details display already present — skipping that part.');
} else {
  content = content.replace(reasonAnchor, bankDetailsBlock);
}

// --- Insertion 2: receipt upload input, right before the bank reference input ---
const inputAnchor = `<input
                  type="text"
                  placeholder="Bank transfer reference"`;
const uploadBlock = `<input
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
                  <p style={{ fontSize: 12, color: "#2e7d32" }}>Receipt attached \u2713</p>
                )}
                <input
                  type="text"
                  placeholder="Bank transfer reference"`;

if (!content.includes(inputAnchor)) {
  console.error('Could not find bank-reference input anchor. Nothing changed.');
  process.exit(1);
}
if (content.includes('accept="image/*"')) {
  console.log('Receipt upload input already present — skipping that part.');
} else {
  content = content.replace(inputAnchor, uploadBlock);
}

// --- Insertion 3: include receiptImagePath when submitting ---
const bodyAnchor = `body: JSON.stringify({ bankReference }),`;
const bodyReplacement = `body: JSON.stringify({
                          bankReference,
                          receiptImagePath: refundInputs[group.order.id]?.receiptImagePath || null,
                        }),`;

if (!content.includes(bodyAnchor)) {
  console.error('Could not find submit-body anchor. Nothing changed.');
  process.exit(1);
}
if (content.includes('receiptImagePath: refundInputs')) {
  console.log('Submit body already includes receiptImagePath — skipping that part.');
} else {
  content = content.replace(bodyAnchor, bodyReplacement);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done: bank details + receipt upload added to ' + path);
