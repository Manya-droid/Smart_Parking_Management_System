// src/components/Receipt.jsx
const fmt = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

export default function Receipt({ session, onDone }) {
  const rows = [
    ['Vehicle', session.vehicleNumber],
    ['Type', session.vehicleType],
    ['Slot', session.slotNumber],
    ['Check-in', fmt(session.checkInTime)],
    ['Check-out', fmt(session.checkOutTime)],
    ['Duration', `${session.durationMinutes} min`],
    ['Payment', (session.paymentMethod || '-').toUpperCase()],
  ];

  return (
    <div className="modal-backdrop">
      <div className="modal-card receipt-modal">
        <div className="receipt-ok">✔ Payment successful · Slot {session.slotNumber} is free again</div>

        <div className="receipt">
          <h2 className="receipt-title">ParkingEase</h2>
          <p className="receipt-sub">
            Parking Receipt · #{String(session._id).slice(-8).toUpperCase()}
          </p>
          <table className="receipt-table">
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k}><td>{k}</td><td>{v}</td></tr>
              ))}
              <tr className="receipt-total"><td>Total paid</td><td>₹{session.fare}</td></tr>
            </tbody>
          </table>
          <p className="receipt-sub" style={{ marginBottom: 0 }}>Thank you! Drive safe.</p>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button className="btn-primary" onClick={() => window.print()}>Print receipt</button>
          <button className="btn-primary" onClick={onDone}>Done</button>
        </div>
      </div>
    </div>
  );
}