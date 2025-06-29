import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [activeUserSection, setActiveUserSection] = useState("therapists");
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newTherapist, setNewTherapist] = useState({
    name: "",
    email: "",
    password: "",
    specialization: "",
    phone: "",
    address: "",
    availability: [{ day: "Monday", start: "09:00", end: "17:00" }],
  });
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [chatbotStats, setChatbotStats] = useState([]);
  const [chatbotLoading, setChatbotLoading] = useState(false);
  const [chatbotError, setChatbotError] = useState("");
  const [reportStats, setReportStats] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportRange, setReportRange] = useState("this_week");

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === "users") {
        if (activeUserSection === "therapists") {
          fetchTherapists();
        } else {
          fetchUsers();
        }
      } else if (activeTab === "therapists") {
        fetchTherapists();
      } else if (activeTab === "appointments") {
        fetchAppointments();
      }
      setLastRefresh(new Date());
    }, 30000);

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, activeUserSection]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 15000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 15000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchTherapists = () => {
    setLoading(true);
    axios
      .get("http://localhost:5000/api/therapists")
      .then((res) => setTherapists(res.data))
      .catch(() => setTherapists([]))
      .finally(() => setLoading(false));
  };

  const fetchUsers = () => {
    setLoading(true);
    axios
      .get("http://localhost:5000/api/admin/users")
      .then((res) => {
        const regularUsers = res.data.filter(user => user.role === 'user');
        setUsers(regularUsers);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  const fetchAppointments = () => {
    setLoading(true);
    axios
      .get("http://localhost:5000/api/admin/appointments")
      .then((res) => setAppointments(res.data))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  };

  const handleAddTherapist = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await axios.post(
        "http://localhost:5000/api/admin/therapists",
        newTherapist
      );
      setSuccess("Therapist added successfully!");
      setShowAdd(false);
      setNewTherapist({
        name: "",
        email: "",
        password: "",
        specialization: "",
        phone: "",
        address: "",
        availability: [{ day: "Monday", start: "09:00", end: "17:00" }],
      });
      fetchTherapists();
    } catch (err) {
      setError("Failed to add therapist.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTherapist = async (id) => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await axios.delete(`http://localhost:5000/api/admin/therapists/${id}`);
      setSuccess("Therapist deleted successfully.");
      fetchTherapists();
    } catch (err) {
      setError("Failed to delete therapist.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${id}`);
      setSuccess("User deleted successfully.");
      fetchUsers();
    } catch (err) {
      setError("Failed to delete user.");
    } finally {
      setLoading(false);
    }
  };

  const addSlot = () => {
    setNewTherapist((t) => ({
      ...t,
      availability: [
        ...t.availability,
        { day: "Monday", start: "09:00", end: "17:00" },
      ],
    }));
  };

  const removeSlot = (idx) => {
    setNewTherapist((t) => ({
      ...t,
      availability: t.availability.filter((_, i) => i !== idx),
    }));
  };

  const handleManualRefresh = () => {
    if (activeTab === "users") {
      if (activeUserSection === "therapists") {
        fetchTherapists();
      } else {
        fetchUsers();
      }
    } else if (activeTab === "therapists") {
      fetchTherapists();
    } else if (activeTab === "appointments") {
      fetchAppointments();
    }
    setLastRefresh(new Date());
  };

  // Load data when tab or section changes
  useEffect(() => {
    if (activeTab === "users") {
      if (activeUserSection === "therapists") {
        fetchTherapists();
      } else {
        fetchUsers();
      }
    } else if (activeTab === "therapists") {
      fetchTherapists();
    } else if (activeTab === "appointments") {
      fetchAppointments();
    }
  }, [activeTab, activeUserSection]);

  // Fetch chatbot usage stats
  useEffect(() => {
    if (activeTab === "chatbot") {
      setChatbotLoading(true);
      axios.get("http://localhost:5000/api/admin/chatbot-usage-stats")
        .then(res => setChatbotStats(res.data))
        .catch(() => setChatbotError("Failed to fetch chatbot usage stats."))
        .finally(() => setChatbotLoading(false));
    }
  }, [activeTab]);

  // Fetch system report stats
  useEffect(() => {
    if (activeTab === "reports") {
      setReportLoading(true);
      axios.get(`http://localhost:5000/api/admin/system-reports?range=${reportRange}`)
        .then(res => setReportStats(res.data))
        .catch(() => setReportError("Failed to fetch system reports."))
        .finally(() => setReportLoading(false));
    }
  }, [activeTab, reportRange]);

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-light bg-white mb-4 shadow-sm rounded">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <span className="navbar-brand fw-bold text-primary">
            MindWell - Admin Panel
          </span>
          <div className="d-flex align-items-center gap-3">
            <span className="text-secondary">{user?.name}</span>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => {
                localStorage.clear();
                window.location.href = "/login";
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <div className="container py-4">
        <ul className="nav nav-tabs mb-4">
          {[
            { id: "users", label: "Users" },
            { id: "therapists", label: "Therapists" },
            { id: "appointments", label: "Appointments" },
            { id: "chatbot", label: "Chatbot Usage" },
            { id: "reports", label: "Reports" },
          ].map((tab) => (
            <li className="nav-item" key={tab.id}>
              <button
                className={`nav-link${
                  activeTab === tab.id ? " active fw-bold text-primary" : ""
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
        
        {/* Refresh Status Bar */}
        <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded">
          <small className="text-muted">
            Last updated: {lastRefresh.toLocaleTimeString()} | Auto-refresh every 30 seconds
          </small>
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={handleManualRefresh}
            disabled={loading}
            title="Refresh data manually"
          >
            {loading ? "🔄 Refreshing..." : "🔄 Refresh Now"}
          </button>
        </div>
        <div
          className="card"
          style={{
            borderRadius: 16,
            background: "linear-gradient(135deg, #e0f7fa 0%, #e8f5e9 100%)",
            boxShadow: "0 8px 32px rgba(44, 62, 80, 0.12)",
          }}
        >
          <div className="card-body">
            {activeTab === "users" && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>User Management</h5>
                  <div className="d-flex gap-2">
                    <button
                      className={`btn btn-sm ${
                        activeUserSection === "therapists" 
                          ? "btn-primary" 
                          : "btn-outline-primary"
                      }`}
                      onClick={() => setActiveUserSection("therapists")}
                    >
                      Therapists
                    </button>
                    <button
                      className={`btn btn-sm ${
                        activeUserSection === "users" 
                          ? "btn-primary" 
                          : "btn-outline-primary"
                      }`}
                      onClick={() => setActiveUserSection("users")}
                    >
                      Regular Users
                    </button>
                  </div>
                </div>

                {activeUserSection === "therapists" && (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6>Therapists ({therapists.length})</h6>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setShowAdd(true)}
                      >
                        Add Therapist
                      </button>
                    </div>
                    {error && (
                      <div className="alert alert-danger py-2">{error}</div>
                    )}
                    {success && (
                      <div className="alert alert-success py-2">{success}</div>
                    )}
                    {loading && <div>Loading...</div>}
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Specialization</th>
                          <th>Phone</th>
                          <th>Address</th>
                          <th>Availability</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {therapists.map((t) => (
                          <tr key={t._id}>
                            <td>{t.name}</td>
                            <td>{t.email}</td>
                            <td>{t.specialization}</td>
                            <td>{t.phone}</td>
                            <td>{t.address}</td>
                            <td>
                              {(t.availability || []).map((a, i) => (
                                <div key={i}>
                                  {a.day}: {a.start}-{a.end}
                                </div>
                              ))}
                            </td>
                            <td>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteTherapist(t._id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {activeUserSection === "users" && (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6>Regular Users ({users.length})</h6>
                    </div>
                    {error && (
                      <div className="alert alert-danger py-2">{error}</div>
                    )}
                    {success && (
                      <div className="alert alert-success py-2">{success}</div>
                    )}
                    {loading && <div>Loading...</div>}
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Address</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u._id}>
                            <td>{u.name}</td>
                            <td>{u.email}</td>
                            <td>{u.phone || "N/A"}</td>
                            <td>{u.address || "N/A"}</td>
                            <td>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteUser(u._id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </>
            )}

            {activeTab === "therapists" && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>Therapists ({therapists.length})</h5>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowAdd(true)}
                  >
                    Add Therapist
                  </button>
                </div>
                {error && (
                  <div className="alert alert-danger py-2">{error}</div>
                )}
                {success && (
                  <div className="alert alert-success py-2">{success}</div>
                )}
                {loading && <div>Loading...</div>}
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Specialization</th>
                      <th>Phone</th>
                      <th>Address</th>
                      <th>Availability</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {therapists.map((t) => (
                      <tr key={t._id}>
                        <td>{t.name}</td>
                        <td>{t.email}</td>
                        <td>{t.specialization}</td>
                        <td>{t.phone}</td>
                        <td>{t.address}</td>
                        <td>
                          {(t.availability || []).map((a, i) => (
                            <div key={i}>
                              {a.day}: {a.start}-{a.end}
                            </div>
                          ))}
                        </td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteTherapist(t._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {activeTab === "appointments" && (
              <>
                <h5>Appointments ({appointments.length})</h5>
                {error && (
                  <div className="alert alert-danger py-2">{error}</div>
                )}
                {success && (
                  <div className="alert alert-success py-2">{success}</div>
                )}
                {loading && <div>Loading...</div>}
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>User</th>
                      <th>Therapist</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a) => (
                      <tr key={a._id}>
                        <td>{new Date(a.date).toLocaleString()}</td>
                        <td>
                          {a.user?.name} ({a.user?.email})
                        </td>
                        <td>
                          {a.therapist?.name} ({a.therapist?.email})
                        </td>
                        <td>{a.type}</td>
                        <td>{a.status}</td>
                        <td>
                          {a.type === 'Video Call' && (
                            <AdminStartVideoCallButton appointment={a} />
                          )}
                          <button
                            className="btn btn-outline-success btn-sm ms-2"
                            disabled={a.status === 'completed'}
                            onClick={async () => {
                              try {
                                await axios.put(
                                  `http://localhost:5000/api/appointments/${a._id}/status`,
                                  { status: "completed" }
                                );
                                fetchAppointments();
                              } catch (err) {
                                setError("Failed to mark as completed.");
                              }
                            }}
                            style={{ marginLeft: a.type === 'Video Call' ? 8 : 0 }}
                          >
                            Mark as Completed
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            {activeTab === "chatbot" && (
              <div>
                <h5>Chatbot Usage Stats</h5>
                {chatbotLoading ? (
                  <div>Loading...</div>
                ) : chatbotError ? (
                  <div className="alert alert-danger py-2">{chatbotError}</div>
                ) : (
                  <>
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Email</th>
                          <th>Total Messages</th>
                          <th>Last Used</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chatbotStats.map((stat, idx) => (
                          <tr key={idx}>
                            <td>{stat.user?.name || "-"}</td>
                            <td>{stat.user?.email || "-"}</td>
                            <td>{stat.totalMessages}</td>
                            <td>{stat.lastUsed ? new Date(stat.lastUsed).toLocaleString() : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {/* Bar chart: messages per user */}
                    <div style={{ maxWidth: 600, margin: '0 auto' }}>
                      <Bar
                        data={{
                          labels: chatbotStats.map(stat => stat.user?.name || stat.user?.email || "Unknown"),
                          datasets: [
                            {
                              label: 'Messages',
                              data: chatbotStats.map(stat => stat.totalMessages),
                              backgroundColor: 'rgba(54, 162, 235, 0.6)',
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { display: false },
                            title: { display: true, text: 'Messages per User' },
                          },
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
            {activeTab === "reports" && (
              <div>
                <h5>System Reports</h5>
                <div className="mb-3">
                  <label>Show stats for: </label>
                  <select
                    className="form-select d-inline-block w-auto ms-2"
                    value={reportRange}
                    onChange={e => setReportRange(e.target.value)}
                  >
                    <option value="this_week">This Week</option>
                    <option value="last_week">Last Week</option>
                    <option value="past_15_days">Past 15 Days</option>
                    <option value="past_30_days">Past 30 Days</option>
                  </select>
                </div>
                {reportLoading ? (
                  <div>Loading...</div>
                ) : reportError ? (
                  <div className="alert alert-danger py-2">{reportError}</div>
                ) : reportStats && (
                  <>
                    <table className="table table-bordered" style={{ maxWidth: 500 }}>
                      <tbody>
                        <tr>
                          <th>Accounts Created</th>
                          <td>{reportStats.accountsCreated}</td>
                        </tr>
                        <tr>
                          <th>Users Who Spoke with Chatbot</th>
                          <td>{reportStats.chatbotUsers}</td>
                        </tr>
                        <tr>
                          <th>Appointments Booked</th>
                          <td>{reportStats.appointmentsBooked}</td>
                        </tr>
                        <tr>
                          <th>Site Visits</th>
                          <td>{reportStats.siteVisits !== null ? reportStats.siteVisits : 'Not tracked'}</td>
                        </tr>
                      </tbody>
                    </table>
                    {/* Bar chart for visual summary */}
                    <div style={{ maxWidth: 600, margin: '0 auto' }}>
                      <Bar
                        data={{
                          labels: ['Accounts Created', 'Chatbot Users', 'Appointments Booked'],
                          datasets: [
                            {
                              label: 'Count',
                              data: [
                                reportStats.accountsCreated,
                                reportStats.chatbotUsers,
                                reportStats.appointmentsBooked,
                              ],
                              backgroundColor: [
                                'rgba(75, 192, 192, 0.6)',
                                'rgba(255, 206, 86, 0.6)',
                                'rgba(153, 102, 255, 0.6)',
                              ],
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { display: false },
                            title: { display: true, text: 'System Activity' },
                          },
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Add Therapist Modal - always rendered at root */}
                {showAdd && (
                  <div
                    className="modal show d-block"
                    tabIndex="-1"
                    role="dialog"
                    style={{ background: "rgba(0,0,0,0.3)" }}
                  >
                    <div className="modal-dialog" role="document">
                      <div className="modal-content">
                        <div className="modal-header">
                          <h5 className="modal-title">Add Therapist</h5>
                          <button
                            type="button"
                            className="btn-close"
                            onClick={() => setShowAdd(false)}
                          ></button>
                        </div>
                        <form onSubmit={handleAddTherapist}>
                          <div className="modal-body">
                            <div className="mb-2">
                              <label>Name</label>
                              <input
                                className="form-control"
                                value={newTherapist.name}
                                onChange={(e) =>
                                  setNewTherapist((t) => ({
                                    ...t,
                                    name: e.target.value,
                                  }))
                                }
                                required
                              />
                            </div>
                            <div className="mb-2">
                              <label>Email</label>
                              <input
                                className="form-control"
                                type="email"
                                value={newTherapist.email}
                                onChange={(e) =>
                                  setNewTherapist((t) => ({
                                    ...t,
                                    email: e.target.value,
                                  }))
                                }
                                required
                              />
                            </div>
                            <div className="mb-2">
                              <label>Password</label>
                              <input
                                className="form-control"
                                type="password"
                                value={newTherapist.password}
                                onChange={(e) =>
                                  setNewTherapist((t) => ({
                                    ...t,
                                    password: e.target.value,
                                  }))
                                }
                                required
                              />
                            </div>
                            <div className="mb-2">
                              <label>Specialization</label>
                              <input
                                className="form-control"
                                value={newTherapist.specialization}
                                onChange={(e) =>
                                  setNewTherapist((t) => ({
                                    ...t,
                                    specialization: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="mb-2">
                              <label>Phone</label>
                              <input
                                className="form-control"
                                value={newTherapist.phone}
                                onChange={(e) =>
                                  setNewTherapist((t) => ({
                                    ...t,
                                    phone: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="mb-2">
                              <label>Address</label>
                              <input
                                className="form-control"
                                value={newTherapist.address}
                                onChange={(e) =>
                                  setNewTherapist((t) => ({
                                    ...t,
                                    address: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="mb-2">
                              <label>Availability</label>
                              {newTherapist.availability.map((a, idx) => (
                                <div
                                  className="d-flex align-items-center mb-1"
                                  key={idx}
                                >
                                  <select
                                    className="form-select me-2"
                                    style={{ width: 120 }}
                                    value={a.day}
                                    onChange={(e) =>
                                      setNewTherapist((t) => ({
                                        ...t,
                                        availability: t.availability.map(
                                          (slot, i) =>
                                            i === idx
                                              ? { ...slot, day: e.target.value }
                                              : slot
                                        ),
                                      }))
                                    }
                                  >
                                    {[
                                      "Monday",
                                      "Tuesday",
                                      "Wednesday",
                                      "Thursday",
                                      "Friday",
                                      "Saturday",
                                      "Sunday",
                                    ].map((day) => (
                                      <option key={day} value={day}>
                                        {day}
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    type="time"
                                    className="form-control me-2"
                                    style={{ width: 120 }}
                                    value={a.start}
                                    onChange={(e) =>
                                      setNewTherapist((t) => ({
                                        ...t,
                                        availability: t.availability.map(
                                          (slot, i) =>
                                            i === idx
                                              ? {
                                                  ...slot,
                                                  start: e.target.value,
                                                }
                                              : slot
                                        ),
                                      }))
                                    }
                                  />
                                  <span className="mx-1">-</span>
                                  <input
                                    type="time"
                                    className="form-control me-2"
                                    style={{ width: 120 }}
                                    value={a.end}
                                    onChange={(e) =>
                                      setNewTherapist((t) => ({
                                        ...t,
                                        availability: t.availability.map(
                                          (slot, i) =>
                                            i === idx
                                              ? { ...slot, end: e.target.value }
                                              : slot
                                        ),
                                      }))
                                    }
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => removeSlot(idx)}
                          disabled={newTherapist.availability.length === 1}
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm mt-1"
                                onClick={addSlot}
                              >
                                Add Slot
                              </button>
                            </div>
                          </div>
                          <div className="modal-footer">
                            <button type="submit" className="btn btn-primary">
                              Add
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => setShowAdd(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
    </div>
  );
};

function AdminStartVideoCallButton({ appointment }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const therapistEmail = appointment.therapist?.email || "";

  const handleStart = async () => {
    setError("");
    setLoading(true);
    try {
      // Only allow login for the correct therapist
      const res = await axios.post('http://localhost:5000/api/auth/login', { email: therapistEmail, password });
      if (res.data.user && res.data.user.role === 'therapist' && res.data.user.email === therapistEmail) {
        window.open(`https://meet.jit.si/${appointment.jitsiRoom}`, '_blank');
        setShowPrompt(false);
      } else {
        setError("Invalid therapist credentials.");
      }
    } catch (err) {
      setError("Invalid therapist credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
                          <button
        className="btn btn-primary btn-sm me-2"
        style={{ minWidth: 120 }}
        onClick={() => setShowPrompt(true)}
      >
        Start Video Call
      </button>
      {showPrompt && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Therapist Login Required</h5>
                <button type="button" className="btn-close" onClick={() => setShowPrompt(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label>Email</label>
                  <input type="email" className="form-control" value={therapistEmail} disabled />
                </div>
                <div className="mb-2">
                  <label>Password</label>
                  <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                {error && <div className="alert alert-danger py-2">{error}</div>}
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={handleStart} disabled={loading}>
                  {loading ? "Starting..." : "Start Video Call"}
                </button>
                <button className="btn btn-secondary" onClick={() => setShowPrompt(false)}>
                  Cancel
                          </button>
          </div>
        </div>
      </div>
    </div>
      )}
    </>
  );
}

export default AdminDashboard;
