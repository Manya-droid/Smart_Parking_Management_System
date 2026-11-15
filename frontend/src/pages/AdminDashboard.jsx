import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import SlotGrid from "../components/SlotGrid";
import AddStaffForm from "../components/AddStaffForm";
import useLiveSlots from "../hooks/useLiveSlots";
import { clearAuth, getAdmin } from "../utils/authStorage";
import SessionsPanel from "../components/SessionsPanel";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const admin = getAdmin();
  const { slots, connected, loading, error } = useLiveSlots();

  const counts = useMemo(() => {
    const total = slots.length;
    const occupied = slots.filter((s) => s.occupancy === "OCCUPIED").length;
    const reserved = slots.filter(
      (s) => s.occupancy !== "OCCUPIED" && s.reservation?.status === "RESERVED",
    ).length;
    return { total, occupied, reserved, free: total - occupied - reserved };
  }, [slots]);

  function handleLogout() {
    clearAuth();
    navigate("/");
  }

  const chips = [
    {
      label: "Total",
      value: counts.total,
      bg: "var(--color-primary-light)",
      color: "var(--color-primary-dark)",
    },
    {
      label: "Occupied",
      value: counts.occupied,
      bg: "#fef2f2",
      color: "#dc2626",
    },
    { label: "Free", value: counts.free, bg: "#ecfdf5", color: "#059669" },
    {
      label: "Reserved",
      value: counts.reserved,
      bg: "#fffbeb",
      color: "#b45309",
    },
  ];

  return (
    <div className="owner-page">
      <header className="owner-header">
        <div>
          <h1 className="owner-title">Admin Dashboard</h1>
          <p className="owner-sub">
            Logged in as {admin?.name || "Admin"} ·{" "}
            <span
              style={{
                color: connected ? "#059669" : "#9ca3af",
                fontWeight: 600,
              }}
            >
              ● {connected ? "Live" : "Reconnecting…"}
            </span>
          </p>
        </div>

        <div className="owner-header-right">
          {!loading &&
            chips.map((c) => (
              <div
                key={c.label}
                className="stat-chip"
                style={{ background: c.bg, color: c.color }}
              >
                <strong>{c.value}</strong> {c.label}
              </div>
            ))}
          <AddStaffForm />
          <Link to="/checkin">Check-in / Check-out</Link>
          <button className="logout-btn" onClick={handleLogout}>
            <span className="logout-emoji">👋</span> Logout
          </button>
        </div>
      </header>

      {error && <div className="error-text">{error}</div>}

      {loading ? (
        <p>Loading slots…</p>
      ) : (
        <div className="owner-layout">
          <section className="owner-panel">
            <h3 className="owner-panel-title">Live slot status</h3>
            <div className="owner-panel-body">
              <SlotGrid slots={slots} />
            </div>
          </section>

          <SessionsPanel />
        </div>
      )}
    </div>
  );
}
