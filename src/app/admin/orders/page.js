"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

const STATUS_STAGE = {
  "Order Placed": 0,
  "Confirmed": 1,
  "Preparing": 2,
  "Ready for Delivery": 3,
  "Out for Delivery": 4,
  "Delivered": 5,
};

function formatDate(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ status }) {
  const stage = STATUS_STAGE[status] ?? 0;
  const isDelivered = stage === 5;
  return (
    <span className={`manifest-status-badge ${isDelivered ? "delivered" : "in-progress"}`}>
      {status}
    </span>
  );
}

function PaymentBadge({ status }) {
  const isPaid = status === "PAID";
  return (
    <span className={`manifest-payment-badge ${isPaid ? "paid" : "unpaid"}`}>
      {status}
    </span>
  );
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.loggedIn || data.role !== "admin") {
          router.push("/login");
        } else {
          setChecking(false);
          loadOrders();
        }
      });
  }, [router]);

  function loadOrders() {
    fetch("/api/admin/orders")
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.orders || []);
        setLoading(false);
      });
  }

  if (checking) {
    return (
      <div className="manifest-page">
        <div className="manifest-shell">
          <Logo />
          <p className="manifest-loading">Checking access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manifest-page">
      <div className="manifest-shell">
        <Logo />

        <div className="manifest-header">
          <div>
            <p className="manifest-eyebrow">Order Oversight</p>
            <h2 className="manifest-title">Marketplace Manifest</h2>
          </div>
          <div className="manifest-count-badge">
            <span className="manifest-count-number">{orders.length}</span>
            <span className="manifest-count-label">
              {orders.length === 1 ? "order" : "orders"} total
            </span>
          </div>
        </div>

        {loading && <p className="manifest-loading">Loading orders...</p>}
        {!loading && orders.length === 0 && (
          <p className="manifest-empty">No orders yet.</p>
        )}

        {orders.map((order) => (
          <div className="manifest-card" key={order.id}>
            <div className="manifest-card-header">
              <span className="manifest-order-id">ORDER #{order.id.slice(-8).toUpperCase()}</span>
              <StatusBadge status={order.status} />
            </div>

            <div className="manifest-body">
              <div className="manifest-row">
                <span className="manifest-label">Customer</span>
                <span className="manifest-value">{order.user?.name} ({order.user?.email})</span>
              </div>
              <div className="manifest-row">
                <span className="manifest-label">Deliver To</span>
                <span className="manifest-value">{order.fullName}, {order.city}, {order.state}</span>
              </div>
              <div className="manifest-row">
                <span className="manifest-label">Placed</span>
                <span className="manifest-value">{formatDate(order.createdAt)}</span>
              </div>

              <div className="manifest-items">
                {order.items.map((item) => (
                  <div className="manifest-item" key={item.id}>
                    <div className="manifest-item-top">
                      <span className="manifest-item-title">{item.listing?.title}</span>
                      <span className="manifest-item-amount">
                        ₦{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                    <div className="manifest-item-meta">
                      Qty {item.quantity} · Vendor: {item.listing?.vendor?.name || "Unknown"}
                    </div>
                    <div className="manifest-item-breakdown">
                      <span>Commission ₦{item.commissionAmount.toLocaleString()}</span>
                      <span>Net ₦{item.vendorNetAmount.toLocaleString()}</span>
                      <span className="manifest-payout-chip">{item.payoutStatus}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="manifest-totals">
                <div className="manifest-total-row">
                  <span>Subtotal</span>
                  <span>₦{order.subtotal.toLocaleString()}</span>
                </div>
                <div className="manifest-total-row">
                  <span>Delivery Fee</span>
                  <span>₦{order.deliveryFee.toLocaleString()}</span>
                </div>
                <div className="manifest-total-row grand">
                  <span>Total</span>
                  <span>₦{order.totalAmount.toLocaleString()}</span>
                </div>
                <div className="manifest-total-row" style={{ marginTop: 6 }}>
                  <span>Payment</span>
                  <PaymentBadge status={order.paymentStatus} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
