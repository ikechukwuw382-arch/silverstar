"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function CheckoutPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    state: "",
    city: "",
    address: "",
    instructions: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cart")
      .then((res) => res.json())
      .then((data) => {
        setCartItems(data.items || []);
        setCartLoading(false);
      });
  }, []);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn && data.savedAddress) {
          const sa = data.savedAddress;
          const hasSavedData = sa.phone || sa.state || sa.city || sa.address;
          if (hasSavedData) {
            setForm((prev) => ({
              ...prev,
              fullName: sa.fullName || prev.fullName,
              phone: sa.phone || prev.phone,
              state: sa.state || prev.state,
              city: sa.city || prev.city,
              address: sa.address || prev.address,
              instructions: sa.instructions || prev.instructions,
            }));
          }
        }
      })
      .catch(() => {
        // fail silently — pre-fill is a convenience, not critical
      });
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      router.push(`/checkout/payment/${data.checkoutGroupId}`);
    } catch (err) {
      setError("Something went wrong.");
      setLoading(false);
    }
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.listing.price * item.quantity,
    0
  );

  return (
    <div>
      <Navbar />
      <div className="section" style={{ paddingTop: 24, maxWidth: 480, margin: "0 auto" }}>
        <h2 className="card-title" style={{ marginBottom: 24 }}>
          Checkout
        </h2>

        {/* Order Summary */}
        <div
          style={{
            border: "1px solid #E4E0D8",
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            background: "#fff",
          }}
        >
          <h3 style={{ margin: "0 0 12px 0", fontSize: 15 }}>Order Summary</h3>

          {cartLoading && (
            <p style={{ color: "#999", fontSize: 14 }}>Loading your items...</p>
          )}

          {!cartLoading && cartItems.length === 0 && (
            <p style={{ color: "#999", fontSize: 14 }}>Your cart is empty.</p>
          )}

          {!cartLoading &&
            cartItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  fontSize: 14,
                }}
              >
                <span style={{ color: "#333" }}>
                  {item.listing.title} × {item.quantity}
                </span>
                <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                  ₦{(item.listing.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}

          {!cartLoading && cartItems.length > 0 && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderTop: "1px solid #E4E0D8",
                  marginTop: 10,
                  paddingTop: 10,
                }}
              >
                <span style={{ color: "#6b6b6b", fontSize: 14 }}>Subtotal</span>
                <span style={{ color: "#6b6b6b", fontSize: 14 }}>
                  ₦{subtotal.toLocaleString()}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ color: "#6b6b6b", fontSize: 14 }}>Delivery Fee</span>
                <span style={{ color: "#6b6b6b", fontSize: 14 }}>
                  Confirmed after order placed
                </span>
              </div>
            </>
          )}
        </div>

        <h2 className="card-title" style={{ marginBottom: 24 }}>
          Delivery Information
        </h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input
            name="fullName"
            placeholder="Full Name"
            value={form.fullName}
            onChange={handleChange}
            required
            style={inputStyle}
          />
          <input
            name="phone"
            type="tel"
            placeholder="Phone Number (e.g. 08012345678)"
            value={form.phone}
            onChange={handleChange}
            required
            pattern="^(\+234|0)[7-9][0-1]\d{8}$"
            title="Enter a valid Nigerian phone number, e.g. 08012345678 or +2348012345678"
            style={inputStyle}
          />
          <input
            name="state"
            placeholder="State"
            value={form.state}
            onChange={handleChange}
            required
            style={inputStyle}
          />
          <input
            name="city"
            placeholder="City"
            value={form.city}
            onChange={handleChange}
            required
            style={inputStyle}
          />
          <input
            name="address"
            placeholder="Full Delivery Address"
            value={form.address}
            onChange={handleChange}
            required
            style={inputStyle}
          />
          <textarea
            name="instructions"
            placeholder="Delivery Instructions (optional)"
            value={form.instructions}
            onChange={handleChange}
            style={{ ...inputStyle, minHeight: 80, fontFamily: "inherit" }}
          />

          {error && <p className="message" style={{ color: "#b3261e" }}>{error}</p>}

          <button type="submit" disabled={loading || cartItems.length === 0} className="btn" style={{ marginTop: 8 }}>
            {loading ? "Placing Order..." : "Place Order"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "12px 14px",
  borderRadius: 8,
  border: "1px solid #E4E0D8",
  fontSize: 15,
  background: "#fff",
};
