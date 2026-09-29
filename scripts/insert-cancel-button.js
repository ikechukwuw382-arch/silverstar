const fs = require('fs');
const path = process.argv[2];

if (!path) {
  console.error('Usage: node insert-cancel-button.js <path-to-page.js>');
  process.exit(1);
}

let content = fs.readFileSync(path, 'utf8');

// --- Insertion 1: new state, right after reviewedIds state ---
const stateAnchor = 'const [reviewedIds, setReviewedIds] = useState([]);';
const stateAddition = `${stateAnchor}
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");`;

if (!content.includes(stateAnchor)) {
  console.error('Could not find state anchor line. Nothing changed.');
  process.exit(1);
}
if (content.includes('const [cancelling, setCancelling]')) {
  console.log('Cancel state already present — skipping that part.');
} else {
  content = content.replace(stateAnchor, stateAddition);
}

// --- Insertion 2: the button itself, right before the Items section ---
const itemsAnchor = '{/* Items */}';
const buttonBlock = `{order.status === "Order Placed" && (
          <div style={{ marginBottom: 24 }}>
            <button
              onClick={async () => {
                if (!confirm("Cancel this order?")) return;
                setCancelling(true);
                setCancelError("");
                try {
                  const res = await fetch(\`/api/orders/\${order.id}/cancel\`, { method: "POST" });
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

        ${itemsAnchor}`;

if (!content.includes(itemsAnchor)) {
  console.error('Could not find Items anchor. Nothing changed.');
  process.exit(1);
}
if (content.includes('Cancel this order?')) {
  console.log('Cancel button already present — skipping that part.');
} else {
  content = content.replace(itemsAnchor, buttonBlock);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done: cancel button + state inserted into ' + path);
