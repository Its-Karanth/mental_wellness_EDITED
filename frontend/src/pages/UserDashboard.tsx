import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface RecentActivity {
  id: string;
  activity: string;
  time: string;
}

interface DashboardStats {
  upcomingSessions: number;
  aiConversations: number;
  daysStreak: number;
  recentActivities: RecentActivity[];
}

interface Appointment {
  _id: string;
  therapist: { name?: string } | string;
  date: string;
  type: string;
  status?: string;
  jitsiRoom?: string;
}

// Phone numbers to assign to therapists
const THERAPIST_PHONE_NUMBERS = [
  "+91 9108639261",
  "+91 8310736323",
  "+91 9731510308"
];

// Add animated background and vibrant UI styles
const dashboardStyles = `
body, #root, .min-vh-100 {
  min-height: 100vh;
  font-family: 'Poppins', 'Inter', Arial, sans-serif;
  background: linear-gradient(270deg, #a1c4fd, #c2e9fb, #fbc2eb, #a6c1ee, #fbc2eb, #a1c4fd);
  background-size: 400% 400%;
  animation: gradientMove 18s ease infinite;
}
@keyframes gradientMove {
  0% {background-position: 0% 50%;}
  50% {background-position: 100% 50%;}
  100% {background-position: 0% 50%;}
}
.card {
  border-radius: 18px !important;
  box-shadow: 0 6px 32px rgba(44, 62, 80, 0.10);
  background: rgba(255,255,255,0.85);
  border: none;
  margin-bottom: 2rem;
}
.card-header {
  background: linear-gradient(90deg, #6a82fb 0%, #fc5c7d 100%);
  color: #fff;
  border-top-left-radius: 18px !important;
  border-top-right-radius: 18px !important;
  font-size: 1.15rem;
  letter-spacing: 1px;
}
.btn-primary, .btn-success, .btn-danger, .btn-secondary {
  border: none;
  border-radius: 8px;
  font-weight: 500;
  transition: box-shadow 0.2s, transform 0.2s;
}
.btn-primary {
  background: linear-gradient(90deg, #43cea2 0%, #185a9d 100%);
  color: #fff;
}
.btn-primary:hover {
  background: linear-gradient(90deg, #185a9d 0%, #43cea2 100%);
  box-shadow: 0 2px 12px #43cea2aa;
  transform: translateY(-2px) scale(1.04);
}
.btn-success {
  background: linear-gradient(90deg, #11998e 0%, #38ef7d 100%);
  color: #fff;
}
.btn-danger {
  background: linear-gradient(90deg, #fc5c7d 0%, #6a82fb 100%);
  color: #fff;
}
.btn-secondary {
  background: #fff;
  color: #6a82fb;
  border: 1px solid #6a82fb;
}
.navbar {
  background: rgba(255,255,255,0.95) !important;
  box-shadow: 0 2px 12px #a1c4fd44;
  border-radius: 0 0 18px 18px;
}
.navbar-brand {
  font-size: 2rem;
  font-weight: bold;
  background: linear-gradient(90deg, #43cea2 0%, #185a9d 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.card .fw-bold.fs-2 {
  color: #6a82fb;
  text-shadow: 0 2px 8px #a1c4fd33;
}
.nav-tabs .nav-link.active {
  background: linear-gradient(90deg, #43cea2 0%, #185a9d 100%);
  color: #fff !important;
  border: none;
  border-radius: 8px 8px 0 0;
}
.nav-tabs .nav-link {
  color: #185a9d;
  font-weight: 500;
  border: none;
  background: transparent;
  border-radius: 8px 8px 0 0;
  margin-right: 2px;
}
.nav-tabs .nav-link:hover {
  background: #fbc2eb44;
  color: #fc5c7d;
}
.alert {
  border-radius: 10px;
  font-size: 1rem;
}
.badge.bg-success {
  background: linear-gradient(90deg, #38ef7d 0%, #11998e 100%);
  color: #fff;
  font-size: 1rem;
  padding: 0.5em 1em;
}
.modal-content {
  border-radius: 18px !important;
  background: rgba(255,255,255,0.97);
}
.form-label {
  color: #185a9d;
  font-weight: 500;
}
.form-control:focus {
  border-color: #6a82fb;
  box-shadow: 0 0 0 2px #a1c4fd55;
}
`;

if (typeof document !== 'undefined' && !document.getElementById('dashboard-animated-style')) {
  const style = document.createElement('style');
  style.id = 'dashboard-animated-style';
  style.innerHTML = dashboardStyles;
  document.head.appendChild(style);
}

const UserDashboard = () => {
  const navigate = useNavigate();
  const userRef = useRef(JSON.parse(localStorage.getItem("user")));
  const [activeTab, setActiveTab] = useState("overview");
  const [showModal, setShowModal] = useState(false);
  const [modalAppointment, setModalAppointment] = useState(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [chatError, setChatError] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    upcomingSessions: 0,
    aiConversations: 0,
    daysStreak: 0,
    recentActivities: [],
  });
  const [timeoutError, setTimeoutError] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showChangePw, setShowChangePw] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  useEffect(() => {
    if (!userRef.current) {
      navigate("/login");
      return;
    } else if (userRef.current.role === "therapist") {
      navigate("/therapist-dashboard");
      return;
    } else if (userRef.current.role === "admin") {
      navigate("/admin-dashboard");
      return;
    }
    fetchAppointments();
    fetchChatHistory();
    // Only on mount
    // eslint-disable-next-line
  }, []);

  function fetchAppointments() {
    if (!userRef.current) return;
    setAppointmentsLoading(true);
    setAppointmentsError("");
    axios
      .get(`http://localhost:5000/api/appointments/user/${userRef.current.id}`)
      .then((res) => setAppointments(res.data))
      .catch((err) => {
        setAppointments([]);
        setAppointmentsError("Failed to load appointments.");
        console.error("Appointments fetch error:", err);
      })
      .finally(() => setAppointmentsLoading(false));
  }

  async function fetchChatHistory() {
    if (!userRef.current?.id) return;
    setChatLoading(true);
    setChatError("");
    try {
      const res = await axios.get(`http://localhost:5000/api/chat/history/${userRef.current.id}`);
      if (res.data.messages) {
        setChatMessages(res.data.messages);
      } else {
        setChatMessages([]);
      }
    } catch (err) {
      setChatMessages([]);
      setChatError("Failed to load chat history.");
      console.error("Chat history fetch error:", err);
    } finally {
      setChatLoading(false);
    }
  }

  const handleRetry = () => {
    fetchAppointments();
    fetchChatHistory();
  };

  // Calculate stats
  useEffect(() => {
    if (appointmentsLoading || chatLoading) return;
    // Upcoming Sessions: future, non-completed appointments
    const now = new Date();
    const upcoming = appointments.filter(
      (a) => new Date(a.date) > now && a.status !== 'completed'
    );
    // AI Conversations: user messages in chat (non-empty)
    const aiConvos = chatMessages.filter(
      (m) => m.sender === 'user' && m.text && m.text.trim() !== ''
    ).length;
    // Days Streak: consecutive days with activity
    const daysWithActivity = new Set([
      ...appointments.map((a) => new Date(a.date).toDateString()),
      ...chatMessages.map((m) => new Date(m.timestamp || now).toDateString()),
    ]);
    let streak = 0;
    let d = new Date();
    while (daysWithActivity.has(d.toDateString())) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    if (daysWithActivity.size === 0) streak = 0;
    // Recent Activity: last 5 actions
    const activities = [
      ...appointments.map((a) => ({
        type: 'appointment',
        activity: `Booked appointment with ${typeof a.therapist === 'object' && a.therapist !== null ? a.therapist.name ?? '' : a.therapist}`,
        time: new Date(a.date),
      })),
      ...chatMessages.filter((m) => m.sender === 'user').map((m) => ({
        type: 'chat',
        activity: 'Chatted with AI Assistant',
        time: new Date(m.timestamp || now),
      })),
    ]
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 5)
      .map((a, i) => ({ id: String(i + 1), activity: a.activity, time: a.time.toLocaleString() }));
    setStats({
      upcomingSessions: upcoming.length || 0,
      aiConversations: aiConvos || 0,
      daysStreak: streak || 0,
      recentActivities: activities,
    });
  }, [appointments, chatMessages, appointmentsLoading, chatLoading]);

  useEffect(() => {
    setTimeoutError(false);
    const timeout = setTimeout(() => {
      if (appointmentsLoading || chatLoading) {
        setTimeoutError(true);
        console.error('Dashboard loading timeout: appointmentsLoading:', appointmentsLoading, 'chatLoading:', chatLoading);
      }
    }, 10000); // 10 seconds
    return () => clearTimeout(timeout);
  }, [appointmentsLoading, chatLoading]);

  const handleLogout = () => {
    navigate("/login");
  };

  const upcomingAppointments = [
    {
      id: 1,
      therapist: "Dr. Sarah Johnson",
      date: "2024-06-22",
      time: "2:00 PM",
      type: "Video Call",
    },
    {
      id: 2,
      therapist: "Dr. Michael Chen",
      date: "2024-06-25",
      time: "10:00 AM",
      type: "In-Person",
    },
  ];

  // Find next appointment within 24 hours
  const now = new Date();
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const soonAppointments = appointments.filter((a) => {
    const apptDate = new Date(a.date);
    return apptDate > now && apptDate <= next24h;
  });

  // Helper to mask password
  function maskPassword(pw) {
    if (!pw) return "********";
    return "*".repeat(Math.max(8, pw.length));
  }

  // Delete account handler
  async function handleDeleteAccount() {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${userRef.current.id}`);
      localStorage.clear();
      setDeleteLoading(false);
      navigate("/register");
    } catch (err) {
      setDeleteLoading(false);
      setDeleteError("Failed to delete account. Please try again.");
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    if (!oldPw || !newPw || !confirmPw) {
      setPwError("All fields are required.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("New passwords do not match.");
      return;
    }
    setPwLoading(true);
    try {
      await axios.put(`http://localhost:5000/api/users/${userRef.current.id}`, {
        oldPassword: oldPw,
        newPassword: newPw
      });
      setPwSuccess("Password changed successfully!");
      setOldPw(""); setNewPw(""); setConfirmPw("");
      setShowChangePw(false);
    } catch (err) {
      setPwError(err.response?.data?.error || "Failed to change password.");
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="min-vh-100 bg-light">
      {/* Reminder banner */}
      {soonAppointments.length > 0 && (
        <div className="alert alert-warning text-center mb-3">
          <b>Reminder:</b> You have an upcoming appointment with {typeof soonAppointments[0].therapist === 'object' && soonAppointments[0].therapist !== null ? soonAppointments[0].therapist.name ?? '' : String(soonAppointments[0].therapist)} on {soonAppointments[0].date}.
        </div>
      )}

      {/* Header */}
      <nav className="navbar navbar-light bg-white mb-4 shadow-sm rounded">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <span className="navbar-brand fw-bold text-primary">MindWell</span>
          <div className="d-flex align-items-center gap-3">
            <span className="text-secondary">Welcome back, {userRef.current?.name}!</span>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {(appointmentsLoading || chatLoading) && !timeoutError ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div>Loading your dashboard...</div>
        </div>
      ) : timeoutError ? (
        <div className="alert alert-danger text-center my-5">
          <div>Dashboard loading timed out. Please check your network or try refreshing.</div>
        </div>
      ) : (appointmentsError || chatError) ? (
        <div className="alert alert-danger text-center my-5">
          {appointmentsError && <div>{appointmentsError}</div>}
          {chatError && <div>{chatError}</div>}
          <button className="btn btn-primary mt-3" onClick={handleRetry}>Retry</button>
        </div>
      ) : (
        <div className="container py-4">
          {/* Navigation Tabs */}
          <ul className="nav nav-tabs mb-4">
            {[
              { id: "overview", label: "Overview" },
              { id: "appointments", label: "Appointments" },
              { id: "chat", label: "AI Assistant" },
              { id: "profile", label: "Profile" },
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

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="row g-4 mb-4">
              {/* Quick Stats */}
              <div className="col-md-4">
                <div className="card p-3 text-center">
                  <div className="fw-bold fs-2">{stats.upcomingSessions}</div>
                  <div className="text-secondary">Upcoming Sessions</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card p-3 text-center">
                  <div className="fw-bold fs-2">{stats.aiConversations}</div>
                  <div className="text-secondary">AI Conversations</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card p-3 text-center">
                  <div className="fw-bold fs-2">{stats.daysStreak}</div>
                  <div className="text-secondary">Days Streak</div>
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Appointments */}
          {activeTab === "overview" && (
            <>
              <div className="card mb-4">
                <div className="card-header fw-bold">Upcoming Appointments</div>
                <div className="card-body">
                  {appointments.filter(a => new Date(a.date) > new Date() && a.status !== 'completed').length === 0 && <div>No upcoming appointments found.</div>}
                  {appointments.filter(a => new Date(a.date) > new Date() && a.status !== 'completed').map((appointment) => (
                    <div
                      key={appointment._id?.toString()}
                      className="d-flex justify-content-between align-items-center border-bottom py-2"
                    >
                      <div>
                        <div className="fw-semibold">
                          {typeof appointment.therapist === 'object' && appointment.therapist !== null ? appointment.therapist.name ?? '' : String(appointment.therapist)}
                        </div>
                        <div className="text-secondary small">
                          {new Date(appointment.date).toLocaleString()}
                        </div>
                        <div className="text-primary small">{appointment.type}</div>
                        {appointment.type === 'Video Call' && appointment.jitsiRoom && (
                          <div className="mt-1">
                            <a
                              href={`https://meet.jit.si/${appointment.jitsiRoom}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline-primary btn-sm"
                            >
                              Join Video Call
                            </a>
                            <div className="small text-muted mt-1">
                              Your session will start when your therapist joins the call.
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setModalAppointment(appointment);
                            setShowModal(true);
                          }}
                        >
                          Details
                        </button>
                        {appointment.status !== 'completed' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={async () => {
                              try {
                                await axios.put(
                                  `http://localhost:5000/api/appointments/${appointment._id}/status`,
                                  { status: "completed" }
                                );
                                fetchAppointments();
                              } catch (err) {
                                alert("Failed to update status.");
                              }
                            }}
                          >
                            Mark as Completed
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Completed Appointments Section */}
              <div className="card mb-4">
                <div className="card-header fw-bold">Completed Appointments</div>
                <div className="card-body">
                  {appointments.filter(a => a.status === 'completed').length === 0 && <div>No completed appointments yet.</div>}
                  {appointments.filter(a => a.status === 'completed').map((appointment) => (
                    <div
                      key={appointment._id?.toString()}
                      className="d-flex justify-content-between align-items-center border-bottom py-2"
                    >
                      <div>
                        <div className="fw-semibold">
                          {typeof appointment.therapist === 'object' && appointment.therapist !== null ? appointment.therapist.name ?? '' : String(appointment.therapist)}
                        </div>
                        <div className="text-secondary small">
                          {new Date(appointment.date).toLocaleString()}
                        </div>
                        <div className="text-primary small">{appointment.type}</div>
                      </div>
                      <span className="badge bg-success">Completed</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Recent Activity */}
          {activeTab === "overview" && (
            <div className="card mb-4">
              <div className="card-header fw-bold">Recent Activity</div>
              <div className="card-body">
                {stats.recentActivities.length === 0 && <div>No recent activity.</div>}
                {stats.recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="d-flex align-items-center border-bottom py-2"
                  >
                    <div>
                      <div className="text-secondary small">{activity.activity}</div>
                      <div className="text-muted small">{activity.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {activeTab === "appointments" && (
            <div className="card mb-4">
              <div className="card-header fw-bold">Book New Appointment</div>
              <div className="card-body">
                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/appointments")}
                >
                  Book Appointment
                </button>
              </div>
            </div>
          )}

          {activeTab === "chat" && (
            <div className="card mb-4">
              <div className="card-header fw-bold">AI Wellness Assistant</div>
              <div className="card-body">
                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/chat")}
                >
                  Start Chat
                </button>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="card mb-4" style={{ maxWidth: 500, margin: "0 auto" }}>
              <div className="card-header fw-bold">Profile Information</div>
              <div className="card-body">
                <div className="mb-3">
                  <b>Name:</b> {userRef.current?.name}
                </div>
                <div className="mb-3">
                  <b>Email:</b> {userRef.current?.email}
                </div>
                <div className="mb-3">
                  <b>Password:</b> {maskPassword(userRef.current?.password)}
                </div>
                <div className="mb-3">
                  <b>Account Created:</b> {userRef.current?.createdAt ? new Date(userRef.current.createdAt).toLocaleString() : "-"}
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-secondary" onClick={() => setShowChangePw(true)}>
                    Change Password
                  </button>
                  <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)}>
                    Delete Account
                  </button>
                </div>
                {pwSuccess && <div className="alert alert-success mt-3">{pwSuccess}</div>}
                {pwError && <div className="alert alert-danger mt-3">{pwError}</div>}
                {showChangePw && (
                  <form className="mt-3" onSubmit={handleChangePassword} style={{ maxWidth: 400 }}>
                    <div className="mb-2">
                      <label className="form-label">Old Password</label>
                      <input type="password" className="form-control" value={oldPw} onChange={e => setOldPw(e.target.value)} required />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">New Password</label>
                      <input type="password" className="form-control" value={newPw} onChange={e => setNewPw(e.target.value)} required />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Confirm New Password</label>
                      <input type="password" className="form-control" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required />
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-primary" type="submit" disabled={pwLoading}>{pwLoading ? "Changing..." : "Change Password"}</button>
                      <button className="btn btn-secondary" type="button" onClick={() => setShowChangePw(false)} disabled={pwLoading}>Cancel</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Delete Account Modal */}
          {showDeleteModal && (
            <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,0.3)" }}>
              <div className="modal-dialog" role="document">
                <div className="modal-content" style={{ borderRadius: 16 }}>
                  <div className="modal-header bg-danger text-white" style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                    <h5 className="modal-title">Delete Account</h5>
                    <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <p className="text-danger fw-bold">Warning: This action is irreversible. All your data will be permanently deleted. Are you sure you want to proceed?</p>
                    {deleteError && <div className="alert alert-danger py-2">{deleteError}</div>}
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>Cancel</button>
                    <button className="btn btn-danger" onClick={handleDeleteAccount} disabled={deleteLoading}>
                      {deleteLoading ? "Deleting..." : "Delete Permanently"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && modalAppointment && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ background: "rgba(0,0,0,0.3)" }}
        >
          <div className="modal-dialog" role="document">
            <div
              className="modal-content"
              style={{
                borderRadius: 16,
                background: "linear-gradient(135deg, #e0f7fa 0%, #e8f5e9 100%)",
                boxShadow: "0 8px 32px rgba(44, 62, 80, 0.12)",
              }}
            >
              <div
                className="modal-header"
                style={{
                  background: "#b2dfdb",
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                }}
              >
                <h5 className="modal-title" style={{ color: "#00695c" }}>
                  Session Details
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  <b>Therapist:</b>{" "}
                  {typeof modalAppointment.therapist === 'object' && modalAppointment.therapist !== null ? modalAppointment.therapist.name ?? '' : String(modalAppointment.therapist)}
                </p>
                <p>
                  <b>Date:</b>{" "}
                  {new Date(modalAppointment.date).toLocaleString()}
                </p>
                <p>
                  <b>Type:</b> {modalAppointment.type}
                </p>
                <p>
                  <b>Status:</b>{" "}
                  <span
                    style={{
                      color:
                        modalAppointment.status === "completed"
                          ? "#388e3c"
                          : "#fbc02d",
                    }}
                  >
                    {modalAppointment.status}
                  </span>
                </p>
                {/* Session Action Logic */}
                {modalAppointment.type === 'Video Call' && (
                  <a
                    href={`https://meet.jit.si/wellness-app-${modalAppointment._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-success mt-2"
                    style={{ background: "#43a047", borderColor: "#388e3c" }}
                  >
                    Join Video Call
                  </a>
                )}
                {modalAppointment.type === 'Phone Call' && (
                  <div className="alert alert-info mt-2">
                    <b>Phone Number:</b> {
                      (() => {
                        // Assign phone number by therapist index
                        let therapistName = typeof modalAppointment.therapist === 'object' && modalAppointment.therapist !== null
                          ? modalAppointment.therapist.name ?? ''
                          : String(modalAppointment.therapist);
                        // Find therapist index in a stable way
                        const therapistList = [
                          "Dr. Emily Carter",
                          "Dr. Michael Thompson",
                          "Dr. Sophia Lee"
                        ];
                        let idx = therapistList.findIndex(n => therapistName.includes(n));
                        if (idx === -1) idx = 0;
                        return THERAPIST_PHONE_NUMBERS[idx % THERAPIST_PHONE_NUMBERS.length];
                      })()
                    }
                  </div>
                )}
                {modalAppointment.type === 'In-Person' && (
                  <div className="alert alert-warning mt-2">
                    Please connect with your therapist first via Video Call or Phone Call before proceeding to meet in person.
                  </div>
                )}
              </div>
              <div
                className="modal-footer"
                style={{
                  background: "#e0f2f1",
                  borderBottomLeftRadius: 16,
                  borderBottomRightRadius: 16,
                }}
              >
                {modalAppointment.status !== "completed" && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ background: "#388e3c", borderColor: "#2e7d32" }}
                    onClick={async () => {
                      try {
                        await axios.put(
                          `http://localhost:5000/api/appointments/${modalAppointment._id}/status`,
                          { status: "completed" }
                        );
                        setModalAppointment({
                          ...modalAppointment,
                          status: "completed",
                        });
                        // Optionally, refresh appointments list
                        fetchAppointments();
                      } catch (err) {
                        alert("Failed to update status.");
                      }
                    }}
                  >
                    Mark as Completed
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
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

export default UserDashboard;
