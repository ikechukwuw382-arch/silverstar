"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

const STATUS_STAGE = {
  "Requested": 0,
  "Engineer Assigned": 1,
  "On the Way": 2,
  "Diagnosing": 3,
  "Repairing": 4,
  "Completed": 5,
};

function formatDate(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ status }) {
  const stage = STATUS_STAGE[status] ?? 0;
  const isCompleted = stage === 5;
  return (
    <span className={`service-status-badge ${isCompleted ? "completed" : "in-progress"}`}>
      {status}
    </span>
  );
}

function QuoteBadge({ status }) {
  const cls =
    status === "Approved" ? "approved" : status === "Declined" ? "declined" : "pending";
  return <span className={`service-quote-badge ${cls}`}>{status}</span>;
}

export default function AdminServiceRequestsPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.loggedIn || data.role !== "admin") {
          router.push("/login");
        } else {
          setChecking(false);
          loadRequests();
        }
      });
  }, [router]);

  function loadRequests() {
    fetch("/api/admin/service-requests")
      .then((res) => res.json())
      .then((data) => {
        setRequests(data.requests || []);
        setLoading(false);
      });
  }

  if (checking) {
    return (
      <div className="service-page">
        <div className="service-shell">
          <Logo />
          <p className="service-loading">Checking access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="service-page">
      <div className="service-shell">
        <Logo />

        <div className="service-header">
          <div>
            <p className="service-eyebrow">Field Service Oversight</p>
            <h2 className="service-title">Repair Log</h2>
          </div>
          <div className="service-count-badge">
            <span className="service-count-number">{requests.length}</span>
            <span className="service-count-label">
              {requests.length === 1 ? "request" : "requests"} total
            </span>
          </div>
        </div>

        {loading && <p className="service-loading">Loading service requests...</p>}
        {!loading && requests.length === 0 && (
          <p className="service-empty">No service requests yet.</p>
        )}

        {requests.map((r) => (
          <div className="service-card" key={r.id}>
            <div className="service-card-header">
              <span className="service-req-id">#{r.requestNumber}</span>
              <StatusBadge status={r.status} />
            </div>

            <div className="service-body">
              <div className="service-row">
                <span className="service-label">Customer</span>
                <span className="service-value">
                  {r.customer?.name} ({r.customer?.email})
                </span>
              </div>
              <div className="service-row">
                <span className="service-label">Engineer</span>
                <span className="service-value">
                  {r.engineer ? `${r.engineer.name} (${r.engineer.email})` : "Not yet assigned"}
                </span>
              </div>
              <div className="service-row">
                <span className="service-label">Printer</span>
                <span className="service-value">{r.printerBrand} {r.printerModel}</span>
              </div>
              <div className="service-row">
                <span className="service-label">Service Type</span>
                <span className="service-value">{r.serviceType}</span>
              </div>
              <div className="service-row">
                <span className="service-label">Location</span>
                <span className="service-value">{r.address}, {r.city}, {r.state}</span>
              </div>
              <div className="service-row">
                <span className="service-label">Phone</span>
                <span className="service-value">{r.phone}</span>
              </div>
              <div className="service-row">
                <span className="service-label">Requested</span>
                <span className="service-value">{formatDate(r.createdAt)}</span>
              </div>

              <div className="service-problem">
                <span className="service-label">Problem Description</span>
                <p className="service-problem-text">{r.problemDescription}</p>
                {r.additionalInfo && (
                  <p className="service-problem-text muted">{r.additionalInfo}</p>
                )}
              </div>

              {r.quote && (
                <div className="service-quote-panel">
                  <div className="service-quote-header">
                    <span className="service-label">Quote</span>
                    <QuoteBadge status={r.quote.status} />
                  </div>
                  <p className="service-quote-diagnosis">{r.quote.diagnosis}</p>
                  <div className="service-quote-costs">
                    <span>Parts ₦{r.quote.partsCost.toLocaleString()}</span>
                    <span>Labour ₦{r.quote.labourCost.toLocaleString()}</span>
                    <span className="service-quote-total">Total ₦{r.quote.totalCost.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
