// src/components/RecommendationPanel.jsx
import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { socket } from '../api/socket';

export default function RecommendationPanel({ vehicleType, vehicleNumber, preferredZone, onZoneChange }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);

  // one live socket connection while the panel is on screen
  useEffect(() => {
    if (!socket.connected) socket.connect();
    return () => { socket.disconnect(); };
  }, []);

  // fetch the recommendation, and re-fetch whenever any slot changes
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await axiosClient.get('/slots/recommend', {
          params: {
            vehicleType,
            vehicleNumber: vehicleNumber || undefined,
            preferredZone: preferredZone || undefined,
          },
        });
        if (!cancelled) {
          setData(res.data);
          setError('');
          setUpdatedAt(new Date());
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || 'Could not load recommendation.');
      }
    }

    load();
    socket.on('slot:updated', load); // occupancy changed: score again
    return () => {
      cancelled = true;
      socket.off('slot:updated', load);
    };
  }, [vehicleType, vehicleNumber, preferredZone]);

  if (error) return <div className="error-text" style={{ margin: '12px 0' }}>{error}</div>;
  if (!data) return null;

  // Vehicle holds a live booking: check-in will use that slot
  if (data.booked) {
    return (
      <div className="reco-box reco-booked">
        <div className="reco-title">Booked slot</div>
        <div className="reco-main">
          <strong>{data.booked.slotNumber}</strong>
          <span>Zone {data.booked.zone} · {data.booked.distanceFromEntry} m from entry</span>
        </div>
        <div className="reco-alt">This vehicle has a booking. Check-in will assign this slot.</div>
      </div>
    );
  }

  const best = data.best;

  return (
    <div className="reco-box">
      <div className="form-group">
        <label className="form-label">Preferred zone (optional)</label>
        <select
          className="form-input"
          value={preferredZone}
          onChange={(e) => onZoneChange(e.target.value)}
        >
          <option value="">No preference</option>
          {(data.zones || []).map((z) => (
            <option key={z} value={z}>Zone {z}</option>
          ))}
        </select>
      </div>

      {!best ? (
        <div className="error-text">No free slots for this vehicle type right now.</div>
      ) : (
        <div>
          <div className="reco-title">Recommended slot (updates live)</div>
          <div className="reco-main">
            <strong>{best.slot.slotNumber}</strong>
            <span>Zone {best.slot.zone} · {best.slot.distanceFromEntry} m from entry</span>
            <span className="reco-score">Score {best.score}</span>
          </div>
          <ul className="reco-reasons">
            {best.reasons.map((r) => <li key={r}>{r}</li>)}
          </ul>
          {data.alternatives.length > 0 && (
            <div className="reco-alt">
              Next best: {data.alternatives.map((a) => a.slot.slotNumber).join(', ')}
            </div>
          )}
        </div>
      )}

      {updatedAt && (
        <div className="reco-alt">Last scored at {updatedAt.toLocaleTimeString('en-IN')}</div>
      )}
    </div>
  );
}