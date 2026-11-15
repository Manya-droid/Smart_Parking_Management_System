import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { socket } from "../api/socket";
import SlotGrid from "../components/SlotGrid";
import useLiveSlots from "../hooks/useLiveSlots";
import { clearOwnerAuth, getOwner } from "../utils/authStorage";

// Small component so the 1-second tick doesn't re-render the whole dashboard
function Countdown({ until }) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);
    const secs = Math.max(0, Math.floor((new Date(until) - now) / 1000));
    return (
        <strong>
            {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}
        </strong>
    );
}

export default function OwnerHome() {
    const navigate = useNavigate();
    const owner = getOwner();
    const { slots, connected, loading, error } = useLiveSlots();

    const [myBooking, setMyBooking] = useState(null);
    const [bookError, setBookError] = useState("");
    const [busy, setBusy] = useState(false);

    // Load my booking now, and again on every live slot change
    useEffect(() => {
        let cancelled = false;
        async function loadBooking() {
            try {
                const res = await axiosClient.get("/bookings/me");
                if (!cancelled) setMyBooking(res.data);
            } catch {
                /* ignore: the banner just stays as it is */
            }
        }
        loadBooking();
        socket.on("slot:updated", loadBooking);
        return () => {
            cancelled = true;
            socket.off("slot:updated", loadBooking);
        };
    }, []);

    // Available = physically free AND not reserved
    const allFree = useMemo(
        () =>
            slots
                .filter(
                    (s) =>
                        s.occupancy === "FREE" &&
                        s.reservation?.status !== "RESERVED",
                )
                .sort((a, b) => a.distanceFromEntry - b.distanceFromEntry),
        [slots],
    );
    // only slots matching the owner's vehicle type, nearest first, never more than 10
    const freeSlots = allFree
        .filter((s) => s.type === owner?.vehicleType)
        .slice(0, 10);

    async function handleBook(slotId) {
        setBookError("");
        setBusy(true);
        try {
            const res = await axiosClient.post("/bookings", { slotId });
            setMyBooking(res.data);
        } catch (err) {
            setBookError(
                err.response?.data?.error ||
                    "Booking failed. Please try again.",
            );
        } finally {
            setBusy(false);
        }
    }

    async function handleCancel() {
        setBookError("");
        setBusy(true);
        try {
            await axiosClient.delete("/bookings/me");
            setMyBooking(null);
        } catch (err) {
            setBookError(
                err.response?.data?.error ||
                    "Could not cancel. Please try again.",
            );
        } finally {
            setBusy(false);
        }
    }

    function handleLogout() {
        clearOwnerAuth();
        navigate("/owner/login");
    }

    return (
        <div className="owner-page">
            <header className="owner-header">
                <div>
                    <h1 className="owner-title">Welcome, {owner?.name}</h1>
                    <p className="owner-sub">
                        {owner?.email} · {owner?.vehicleNumber} (
                        {owner?.vehicleType}) ·{" "}
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
                    {!loading && (
                        <span>
                            <strong>{allFree.length}</strong> of {slots.length}{" "}
                            slots available
                        </span>
                    )}
                    <button className="logout-btn" onClick={handleLogout}>
                        <span className="logout-emoji">👋</span> Logout
                    </button>
                </div>
            </header>

            {error && <div className="error-text">{error}</div>}
            {bookError && <div className="error-text">{bookError}</div>}

            {myBooking && (
                <div className="booking-banner">
                    <span>
                        📌 Your booking: <strong>{myBooking.slotNumber}</strong>{" "}
                        · Zone {myBooking.zone} · {myBooking.distanceFromEntry}{" "}
                        m from entry · held for{" "}
                        <Countdown
                            until={myBooking.reservation.reservedUntil}
                        />
                    </span>
                    <button
                        className="cancel-btn"
                        onClick={handleCancel}
                        disabled={busy}
                    >
                        Cancel booking
                    </button>
                </div>
            )}

            {loading ? (
                <p>Loading slots…</p>
            ) : (
                <div className="owner-layout">
                    {/* LEFT: all available slots */}
                    <section className="owner-panel">
                        <h3 className="owner-panel-title">
                            All available slots
                        </h3>
                        <div className="owner-panel-body">
                            <SlotGrid slots={allFree} />
                        </div>
                    </section>

                    {/* RIGHT: 10 nearest to entry, with Book buttons */}
                    <section className="owner-panel">
                        <h3 className="owner-panel-title">
                            10 nearest to entry
                        </h3>
                        <div className="owner-panel-body">
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    fontSize: 14,
                                }}
                            >
                                <thead>
                                    <tr>
                                        <th
                                            style={{
                                                padding: 6,
                                                textAlign: "left",
                                            }}
                                        >
                                            #
                                        </th>
                                        <th
                                            style={{
                                                padding: 6,
                                                textAlign: "left",
                                            }}
                                        >
                                            Slot
                                        </th>
                                        <th
                                            style={{
                                                padding: 6,
                                                textAlign: "left",
                                            }}
                                        >
                                            Zone
                                        </th>
                                        <th
                                            style={{
                                                padding: 6,
                                                textAlign: "left",
                                            }}
                                        >
                                            Type
                                        </th>
                                        <th
                                            style={{
                                                padding: 6,
                                                textAlign: "left",
                                            }}
                                        >
                                            Distance
                                        </th>
                                        <th style={{ padding: 6 }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {freeSlots.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                style={{ padding: 8 }}
                                            >
                                                No free slots for your vehicle
                                                type right now.
                                            </td>
                                        </tr>
                                    )}
                                    {freeSlots.map((s, i) => (
                                        <tr
                                            key={s._id}
                                            style={{
                                                borderTop: "1px solid #e5e7eb",
                                            }}
                                        >
                                            <td style={{ padding: 6 }}>
                                                {i + 1}
                                            </td>
                                            <td style={{ padding: 6 }}>
                                                <strong>{s.slotNumber}</strong>
                                            </td>
                                            <td style={{ padding: 6 }}>
                                                {s.zone}
                                            </td>
                                            <td style={{ padding: 6 }}>
                                                {s.type}
                                            </td>
                                            <td style={{ padding: 6 }}>
                                                {s.distanceFromEntry} m
                                            </td>
                                            <td
                                                style={{
                                                    padding: 6,
                                                    textAlign: "right",
                                                }}
                                            >
                                                {s.type ===
                                                owner?.vehicleType ? (
                                                    <button
                                                        className="book-btn"
                                                        disabled={
                                                            busy || !!myBooking
                                                        }
                                                        onClick={() =>
                                                            handleBook(s._id)
                                                        }
                                                        title={
                                                            myBooking
                                                                ? "You already have a booking"
                                                                : "Book this slot"
                                                        }
                                                    >
                                                        Book
                                                    </button>
                                                ) : (
                                                    <span
                                                        title={`Not suitable for a ${owner?.vehicleType}`}
                                                    >
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
