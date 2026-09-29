"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.orders || []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <Navbar />
      <div className="section" style={{ paddingTop: 24, maxWidth: 520, margin: "0 auto" }}>
        <h2 className="card-title" style={{ marginBottom: 24 }}>My Orders</h2>

        {loading && <p className="message">Loading orders...</p>}

        {!loading && orders.length === 0 && (
          <p className="message">You haven't placed any orders yet.</p>
        )}

        {orders.map((order) => (
          <a
            key={order.id}
            href={`/orders/${order.id}`}
            style={{
              display: "block",
              textDecoration: "none",
              color: "inherit",
              border: "1px solid #E4E0D8",
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              background: "#fff",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <strong>Order #{order.id.slice(-8).toUpperCase()}</strong>
              <span style={{ color: "#B8860B", fontWeight: 600 }}>{order.status}</span>
            </div>
            <p style={{ margin: "2px 0", color: "#6b6b6b", fontSize: 14 }}>
              {order.items.length} item{order.items.length !== 1 ? "s" : ""} · ₦{order.totalAmount.toLocaleString()}
            </p>
            <p style={{ margin: "2px 0", color: "#a0a0a0", fontSize: 13 }}>
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
