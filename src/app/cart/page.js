"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";

export default function CartPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  function loadCart() {
    fetch("/api/cart")
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items || []);
        setLoading(false);
      });
  }

  async function updateQuantity(id, quantity) {
    if (quantity < 1) return;
    const res = await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, quantity }),
    });
    if (res.ok) loadCart();
  }

  async function removeItem(id) {
    const res = await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) loadCart();
  }

  const total = items.reduce((sum, item) => sum + item.listing.price * item.quantity, 0);

  return (
    <div>
      <Navbar />
      <div className="section" style={{ paddingTop: 24 }}>
        <h2 className="card-title" style={{ marginBottom: 24 }}>Your Cart</h2>

        {loading && <p className="message">Loading cart...</p>}

        {!loading && items.length === 0 && (
          <p className="message">Your cart is empty. Browse the marketplace to add items.</p>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              gap: 14,
              alignItems: "center",
              border: "1px solid #E4E0D8",
              borderRadius: 12,
              padding: 14,
              marginBottom: 12,
              background: "#fff",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 8,
                flexShrink: 0,
                background: item.listing.imageUrl
                  ? `url(${item.listing.imageUrl})`
                  : "linear-gradient(135deg, #F4EDE0 0%, #EADFC6 100%)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15 }}>{item.listing.title}</h3>
                  <p style={{ margin: "4px 0", color: "#6B6258", fontSize: 13 }}>
                    ₦{item.listing.price.toLocaleString()} each · Sold by {item.listing.vendor?.name || "Vendor"}
                  </p>
                </div>
                <p style={{ fontWeight: 700, margin: 0, whiteSpace: "nowrap" }}>
                  ₦{(item.listing.price * item.quantity).toLocaleString()}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #E4E0D8", borderRadius: 8, padding: "2px 4px" }}>
                  <button
                    style={{ background: "none", border: "none", fontSize: 16, width: 24, cursor: "pointer" }}
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    -
                  </button>
                  <span style={{ minWidth: 18, textAlign: "center", fontSize: 14 }}>{item.quantity}</span>
                  <button
                    style={{ background: "none", border: "none", fontSize: 16, width: 24, cursor: "pointer" }}
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <button className="delete-btn" onClick={() => removeItem(item.id)}>
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}

        {items.length > 0 && (
          <div style={{ marginTop: 24, borderTop: "1px solid #E4E0D8", paddingTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Total</h3>
              <h3 style={{ margin: 0 }}>₦{total.toLocaleString()}</h3>
            </div>
            <a href="/checkout" className="btn" style={{ textDecoration: "none", textAlign: "center", display: "block" }}>
              Proceed to Checkout
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
