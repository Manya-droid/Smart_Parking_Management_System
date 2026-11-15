// src/components/SessionsPanel.jsx
import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { socket } from '../api/socket';

const fmt = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '-';

export default function SessionsPanel() {
  const [tab, setTab] = useState('active');
  const [active, setActive] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [a, h] = await Promise.all([
          axiosClient.get('/sessions/active'),
          axiosClient.get('/sessions/history'),
        ]);
        if (cancelled) return;
        setActive(a.data);
        setHistory(h.data);
        setError('');
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || 'Could not load sessions.');
      }
    }

    load();
    socket.on('slot:updated', load); // every check-in / check-out changes these lists
    const timer = setInterval(() => setNow(Date.now()), 30000); // keeps "Parked for" fresh
    return () => {
      cancelled = true;
      socket.off('slot:updated', load);
      clearInterval(timer);
    };
  }, []);

  const revenue = history.reduce((sum, s) => sum + (s.fare || 0), 0);
  const parkedMin = (s) => Math.max(0, Math.floor((now - new Date(s.checkInTime)) / 60000));

  const tabStyle = (name) => ({
    width: 'auto', padding: '5px 14px', fontSize: 13, opacity: tab === name ? 1 : 0.5,
  });

  return (
    <section className="owner-panel">
      <h3 className="owner-panel-title">Parking records</h3>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button className="btn-primary" style={tabStyle('active')} onClick={() => setTab('active')}>
          Active ({active.length})
        </button>
        <button className="btn-primary" style={tabStyle('history')} onClick={() => setTab('history')}>
          History ({history.length})
        </button>
      </div>

      {error && <div className="error-text" style={{ marginBottom: 8 }}>{error}</div>}

      <div className="owner-panel-body">
        {tab === 'active' ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Vehicle</th><th>Type</th><th>Slot</th><th>Check-in</th><th>Parked for</th></tr>
              </thead>
              <tbody>
                {active.length === 0 && (
                  <tr><td colSpan="5">No vehicles parked right now.</td></tr>
                )}
                {active.map((s) => (
                  <tr key={s._id}>
                    <td><strong>{s.vehicleNumber}</strong></td>
                    <td>{s.vehicleType}</td>
                    <td>{s.slotNumber}</td>
                    <td>{fmt(s.checkInTime)}</td>
                    <td>{parkedMin(s)} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, margin: '0 0 8px' }}>
              Revenue (last {history.length} sessions): <strong>₹{revenue}</strong>
            </p>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Vehicle</th><th>Slot</th><th>Out</th><th>Min</th><th>Fare</th><th>Paid via</th></tr>
                </thead>
                <tbody>
                  {history.length === 0 && (
                    <tr><td colSpan="6">No completed sessions yet.</td></tr>
                  )}
                  {history.map((s) => (
                    <tr key={s._id}>
                      <td><strong>{s.vehicleNumber}</strong></td>
                      <td>{s.slotNumber}</td>
                      <td>{fmt(s.checkOutTime)}</td>
                      <td>{s.durationMinutes}</td>
                      <td>₹{s.fare}</td>
                      <td>{(s.paymentMethod || '-').toUpperCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}