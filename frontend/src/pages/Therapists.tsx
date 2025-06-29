import React, { useEffect, useState } from "react";
import axios from "axios";

const Therapists = () => {
  const [therapists, setTherapists] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [specialization, setSpecialization] = useState("");
  const [day, setDay] = useState("");
  const [selected, setSelected] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);

  const fetchTherapists = () => {
    axios.get("http://localhost:5000/api/therapists").then((res) => {
      setTherapists(res.data);
      setFiltered(res.data);
    }).catch((err) => {
      console.error("Error fetching therapists:", err);
      setTherapists([]);
      setFiltered([]);
    });
  };

  useEffect(() => {
    // Initial fetch
    fetchTherapists();

    // Set up auto-refresh every 30 seconds for real-time synchronization
    const interval = setInterval(() => {
      fetchTherapists();
    }, 30000); // 30 seconds

    setRefreshInterval(interval);

    // Cleanup interval on component unmount
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Get unique specializations and days
  const specializations = Array.from(
    new Set(therapists.map((t) => t.specialization).filter(Boolean))
  );
  const days = Array.from(
    new Set(
      therapists
        .flatMap((t) => (t.availability || []).map((a) => a.day))
        .filter(Boolean)
    )
  );

  // Filter logic
  useEffect(() => {
    let result = therapists;
    if (specialization) {
      result = result.filter((t) => t.specialization === specialization);
    }
    if (day) {
      result = result.filter((t) =>
        (t.availability || []).some((a) => a.day === day)
      );
    }
    setFiltered(result);
  }, [specialization, day, therapists]);

  return (
    <div className="container py-4" style={{ maxWidth: 900 }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Find a Therapist</h2>
        <div className="d-flex align-items-center gap-2">
          <small className="text-muted">
            Auto-refreshing every 30 seconds
          </small>
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={fetchTherapists}
            title="Refresh manually"
          >
            🔄 Refresh
          </button>
        </div>
      </div>
      <div className="row mb-3">
        <div className="col-md-4">
          <label className="form-label">Specialization</label>
          <select
            className="form-select"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
          >
            <option value="">All</option>
            {specializations.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">Available Day</label>
          <select
            className="form-select"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          >
            <option value="">All</option>
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-4 d-flex align-items-end">
          <div className="text-muted">
            Showing {filtered.length} of {therapists.length} therapists
          </div>
        </div>
      </div>
      <div className="row">
        {filtered.length === 0 && (
          <div className="col-12">
            <div className="alert alert-info text-center">
              {therapists.length === 0 
                ? "No therapists available at the moment. Please check back later." 
                : "No therapists match your current filters. Try adjusting your search criteria."
              }
            </div>
          </div>
        )}
        {filtered.map((t) => (
          <div className="col-md-6 mb-4" key={t._id}>
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">{t.name}</h5>
                <p className="card-text mb-1">
                  <b>Email:</b> {t.email}
                </p>
                <p className="card-text mb-1">
                  <b>Specialization:</b> {t.specialization || "N/A"}
                </p>
                <p className="card-text mb-1">
                  <b>Phone:</b> {t.phone || "N/A"}
                </p>
                <p className="card-text mb-1">
                  <b>Availability:</b>{" "}
                  {(t.availability || [])
                    .map((a) => `${a.day} ${a.start}-${a.end}`)
                    .join(", ") || "N/A"}
                </p>
                <button
                  className="btn btn-outline-primary btn-sm mt-2"
                  onClick={() => setSelected(t)}
                >
                  View Profile
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Modal for therapist profile */}
      {selected && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ background: "rgba(0,0,0,0.3)" }}
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selected.name}'s Profile</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelected(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  <b>Email:</b> {selected.email}
                </p>
                <p>
                  <b>Phone:</b> {selected.phone || "N/A"}
                </p>
                <p>
                  <b>Specialization:</b> {selected.specialization || "N/A"}
                </p>
                <p>
                  <b>Address:</b> {selected.address || "N/A"}
                </p>
                <p>
                  <b>Availability:</b>
                </p>
                <ul>
                  {(selected.availability || []).map((a, i) => (
                    <li key={i}>
                      {a.day}: {a.start} - {a.end}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelected(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Therapists;
