// src/components/MyParking.jsx
import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { socket } from '../api/socket';

const fmt = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '-';

export default function MyParking() {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [c, h] = await Promise.all([
          axiosClient.get('/sessions/my/current'),
          axiosClient.get('/sessions/my/history'),
        ]);
        if (cancelled) return;
        setCurrent(c.data);
        setHistory(h.data);
        setError('');
        setLoaded(true);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || 'Could not load your parking records.');
      }
    }

    load();
    socket.on('slot:updated', load);               // check-in / check-out happened
    const timer = setInterval(load, 30000);        // keeps duration and fare-so-far fresh
    return () => {
      cancelled = true;
      socket.off('slot:updated', load);
      clearInterval(timer);
    };
  }, []);

  if (error) return <div className="error-text">{error}</div>;
  if (!loaded) return <p style={{ fontSize: 14 }}>Loading…</p>;

  return (
    <div className="owner-panel-body">
      <div className="reco-title">Current session</div>
      {!current ? (
        <p style={{ fontSize: 14, margin: '4px 0 16px' }}>Your vehicle is not parked right now.</p>
      ) : (
        <div className="reco-box" style={{ margin: '4px 0 16px' }}>
          <div className="reco-main">
            <strong>{current.slotNumber}</strong>
            <span>{current.vehicleNumber} · {current.vehicleType}</span>
            <span className="reco-score">₹{current.fareSoFar ?? '-'} so far</span>
          </div>
          <div className="reco-alt">
            Checked in {fmt(current.checkInTime)} · parked for {current.durationMinutes} min
          </div>
          <div className="reco-alt">The final fare is calculated at check-out.</div>
        </div>
      )}

      <div className="reco-title">Past visits</div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Out</th><th>Slot</th><th>Min</th><th>Fare</th><th>Paid via</th></tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr><td colSpan="5">No completed visits yet.</td></tr>
            )}
            {history.map((s) => (
              <tr key={s._id}>
                <td>{fmt(s.checkOutTime)}</td>
                <td><strong>{s.slotNumber}</strong></td>
                <td>{s.durationMinutes}</td>
                <td>₹{s.fare}</td>
                <td>{(s.paymentMethod || '-').toUpperCase()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}