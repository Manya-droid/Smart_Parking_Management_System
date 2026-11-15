// src/pages/CheckInPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckInForm from '../components/CheckInForm';
import CheckOutForm from '../components/CheckOutForm';
import RecommendationPanel from '../components/RecommendationPanel';
import { clearAuth, getAdmin } from '../utils/authStorage';

export default function CheckInPage() {
  const navigate = useNavigate();
  const admin = getAdmin();
  const [mode, setMode] = useState('checkin'); // 'checkin' or 'checkout'

  // shared between the form (left) and the recommendation panel (right)
  const [reco, setReco] = useState({ vehicleType: '', vehicleNumber: '' });
  const [preferredZone, setPreferredZone] = useState('');

  function switchMode(next) {
    setMode(next);
    setReco({ vehicleType: '', vehicleNumber: '' });
    setPreferredZone('');
  }

  function handleLogout() {
    clearAuth();
    navigate('/');
  }

  return (
    <div className="owner-page">
      <header className="owner-header">
        <div>
          <h1 className="owner-title">ParkingEase</h1>
          <p className="owner-sub">
            Logged in as {admin?.name || 'Staff'}
            {admin?.role ? ` · ${admin.role}` : ''}
          </p>
        </div>
        <div className="owner-header-right">
          {admin?.role === 'admin' && (
            <a onClick={() => navigate('/admin/dashboard')} style={{ cursor: 'pointer' }}>
              Dashboard
            </a>
          )}
          <button className="logout-btn" onClick={handleLogout}>
            <span className="logout-emoji">👋</span> Logout
          </button>
        </div>
      </header>

      <div className="owner-layout" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
        {/* LEFT: check-in / check-out */}
        <section className="owner-panel">
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <button
              className="btn-primary"
              style={{ opacity: mode === 'checkin' ? 1 : 0.5 }}
              onClick={() => switchMode('checkin')}
            >
              Check In
            </button>
            <button
              className="btn-primary"
              style={{ opacity: mode === 'checkout' ? 1 : 0.5 }}
              onClick={() => switchMode('checkout')}
            >
              Check Out
            </button>
          </div>

          <div className="owner-panel-body">
            {mode === 'checkin' ? (
              <CheckInForm
                preferredZone={preferredZone}
                onZoneChange={setPreferredZone}
                onVehicleChange={setReco}
              />
            ) : (
              <CheckOutForm />
            )}
          </div>
        </section>

        {/* RIGHT: live slot recommendation */}
        <section className="owner-panel">
          <h3 className="owner-panel-title">Slot recommendation</h3>
          <div className="owner-panel-body">
            {mode === 'checkin' && reco.vehicleType ? (
              <RecommendationPanel
                vehicleType={reco.vehicleType}
                vehicleNumber={reco.vehicleNumber}
                preferredZone={preferredZone}
                onZoneChange={setPreferredZone}
              />
            ) : (
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
                {mode === 'checkin'
                  ? 'Enter a vehicle number and click "Check Vehicle". The best slot will appear here and update live as slots fill up.'
                  : 'Recommendations appear while checking a vehicle in.'}
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}