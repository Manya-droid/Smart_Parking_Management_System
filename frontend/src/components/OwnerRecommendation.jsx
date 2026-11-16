// src/components/OwnerRecommendation.jsx
import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { socket } from '../api/socket';

export default function OwnerRecommendation({ onBook, disabled }) {
  const [data, setData] = useState(null);
  const [zone, setZone] = useState('');
  const [error, setError] = useState('');

  // fetch the recommendation, and score again whenever any slot changes
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await axiosClient.get('/slots/my-recommendation', {
          params: { preferredZone: zone || undefined },
        });
        if (!cancelled) { setData(res.data); setError(''); }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || 'Could not load recommendation.');
      }
    }

    load();
    socket.on('slot:updated', load);
    return () => {
      cancelled = true;
      socket.off('slot:updated', load);
    };
  }, [zone]);

  if (error) return <div className="error-text" style={{ marginBottom: 10 }}>{error}</div>;
  if (!data) return null;

  const best = data.best;

  return (
    <div className="reco-box" style={{ margin: '0 0 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div className="reco-title" style={{ margin: 0 }}>Recommended for you · live</div>
        <select
          className="form-input"
          style={{ width: 'auto', padding: '3px 8px', fontSize: 12 }}
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          title="Preferred zone"
        >
          <option value="">Any zone</option>
          {(data.zones || []).map((z) => (
            <option key={z} value={z}>Zone {z}</option>
          ))}
        </select>
      </div>

      {!best ? (
        <p style={{ fontSize: 13, margin: '8px 0 0' }}>No free slots for your vehicle type right now.</p>
      ) : (
        <>
          <div className="reco-main" style={{ marginTop: 8 }}>
            <strong>{best.slot.slotNumber}</strong>
            <span>Zone {best.slot.zone} · {best.slot.distanceFromEntry} m from entry</span>
            <span className="reco-score">Score {best.score}</span>
          </div>
          <ul className="reco-reasons">
            {best.reasons.map((r) => <li key={r}>{r}</li>)}
          </ul>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 8 }}>
            <span className="reco-alt" style={{ margin: 0 }}>
              {data.alternatives.length > 0 &&
                `Next best: ${data.alternatives.map((a) => a.slot.slotNumber).join(', ')}`}
            </span>
            <button
              className="book-btn"
              disabled={disabled}
              title={disabled ? 'You already have a booking' : 'Book the recommended slot'}
              onClick={() => onBook(best.slot._id)}
            >
              Book {best.slot.slotNumber}
            </button>
          </div>
        </>
      )}
    </div>
  );
}