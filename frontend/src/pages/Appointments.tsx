import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Appointments = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [therapists, setTherapists] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [type, setType] = useState("Video Call");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Fetch therapists
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/therapists")
      .then((res) => setTherapists(res.data))
      .catch(() => setTherapists([]));
  }, []);

  // Fetch user's appointments
  const fetchAppointments = () => {
    axios
      .get(`http://localhost:5000/api/appointments/user/${user.id}`)
      .then((res) => setAppointments(res.data))
      .catch(() => setAppointments([]));
  };
  
  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line
  }, []);

  // Fetch available slots when therapist or date changes
  useEffect(() => {
    if (!selectedTherapist || !selectedDate) {
      setAvailableSlots([]);
      setSelectedTime("");
      return;
    }

    setAvailabilityLoading(true);
    setAvailabilityError("");
    
    // Format date for API (YYYY-MM-DD)
    const dateStr = new Date(selectedDate).toISOString().split('T')[0];
    
    axios.get(`http://localhost:5000/api/therapists/${selectedTherapist}/availability/${dateStr}`)
      .then((res) => {
        if (res.data.available) {
          setAvailableSlots(res.data.availableSlots);
      setSelectedTime("");
        } else {
          setAvailableSlots([]);
          setAvailabilityError(res.data.message);
        }
      })
      .catch((err) => {
        setAvailableSlots([]);
        setAvailabilityError(err.response?.data?.error || "Failed to fetch availability");
      })
      .finally(() => {
        setAvailabilityLoading(false);
      });
  }, [selectedTherapist, selectedDate]);

  // Helper to format time as 12-hour with AM/PM
  function formatTime12h(time) {
    const [h, m] = time.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
  }

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Book appointment
  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!user || !user.id) {
      setError("You must be logged in to book an appointment.");
      return;
    }
    
    if (!selectedTherapist || !selectedDate || !selectedTime) {
      setError("Please select a therapist, date, and time.");
      return;
    }

    // Validate that selected time is in available slots
    if (!availableSlots.includes(selectedTime)) {
      setError("Selected time is not available. Please choose from the available slots.");
      return;
    }

    // Create appointment date
    const appointmentDate = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(":").map(Number);
    appointmentDate.setHours(hours, minutes, 0, 0);

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/appointments", {
        user: user.id,
        therapist: selectedTherapist,
        date: appointmentDate.toISOString(),
        type,
      });
      
      setSuccess(response.data.message || "Appointment booked successfully!");
      
      // Reset form
      setSelectedTherapist("");
      setSelectedDate("");
      setSelectedTime("");
      setType("Video Call");
      setAvailableSlots([]);
      
      // Refresh appointments list
      fetchAppointments();
      
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Failed to book appointment. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Get therapist name by ID
  const getTherapistName = (therapistId) => {
    const therapist = therapists.find(t => t._id === therapistId);
    return therapist ? therapist.name : "Unknown Therapist";
  };

  // Get therapist availability message
  const getTherapistAvailabilityMessage = (therapistId) => {
    const therapist = therapists.find(t => t._id === therapistId);
    if (!therapist || !therapist.availability || therapist.availability.length === 0) {
      return null;
    }

    const availability = therapist.availability;
    
    if (availability.length === 1) {
      const slot = availability[0];
      return `📅 ${therapist.name} is available only on ${slot.day}s from ${slot.start} to ${slot.end}`;
    } else if (availability.length === 2) {
      const days = availability.map(slot => slot.day).join('s and ');
      return `📅 ${therapist.name} is available on ${days}s`;
    } else {
      const days = availability.map(slot => slot.day).join('s, ');
      return `📅 ${therapist.name} is available on ${days}s`;
    }
  };

  // Get selected therapist's availability details
  const selectedTherapistInfo = therapists.find(t => t._id === selectedTherapist);
  const availabilityMessage = getTherapistAvailabilityMessage(selectedTherapist);

  return (
    <div className="container py-4" style={{ maxWidth: 800 }}>
      <div className="card mb-4">
        <div className="card-header fw-bold">Book Appointment</div>
        <div className="card-body">
          {/* Availability Message */}
          {availabilityMessage && (
            <div className="alert alert-info mb-4">
              <div className="d-flex align-items-center">
                <i className="fas fa-info-circle me-2"></i>
                <div>
                  <strong>Availability Information:</strong><br />
                  {availabilityMessage}
                  {selectedTherapistInfo?.availability && (
                    <div className="mt-2">
                      <small className="text-muted">
                        <strong>Detailed Schedule:</strong><br />
                        {selectedTherapistInfo.availability.map((slot, index) => (
                          <span key={index}>
                            {slot.day}: {slot.start} - {slot.end}
                            {index < selectedTherapistInfo.availability.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </small>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* No Therapist Selected Message */}
          {!selectedTherapist && (
            <div className="alert alert-light mb-4">
              <div className="d-flex align-items-center">
                <i className="fas fa-lightbulb me-2"></i>
                <div>
                  <strong>💡 Tip:</strong> Select a therapist above to see their availability schedule. 
                  The availability days are shown in parentheses next to each therapist's name.
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleBook} className="row g-3 align-items-end">
            {/* Therapist Selection */}
            <div className="col-md-6">
              <label className="form-label">Select Therapist</label>
              <select
                className="form-select"
                value={selectedTherapist}
                onChange={(e) => {
                  setSelectedTherapist(e.target.value);
                  setSelectedDate("");
                  setSelectedTime("");
                  setAvailableSlots([]);
                }}
                required
              >
                <option value="">Choose a therapist...</option>
                {therapists.map((t) => {
                  const availabilityText = t.availability && t.availability.length > 0 
                    ? ` (${t.availability.map(slot => slot.day).join(', ')})`
                    : '';
                  return (
                  <option key={t._id} value={t._id}>
                      {t.name} {t.specialization ? `(${t.specialization})` : ''}{availabilityText}
                  </option>
                  );
                })}
              </select>
              <small className="text-muted">
                Availability is shown in parentheses for each therapist
              </small>
            </div>

            {/* Date Selection */}
            <div className="col-md-6">
              <label className="form-label">Select Date</label>
              <input
                type="date"
                className="form-control"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTime("");
                }}
                min={getMinDate()}
                required
                disabled={!selectedTherapist}
              />
            </div>

            {/* Time Selection */}
            <div className="col-md-6">
              <label className="form-label">Select Time</label>
              {availabilityLoading ? (
                <div className="form-control-plaintext">Loading available times...</div>
              ) : availabilityError ? (
                <div className="alert alert-warning py-2 mb-0">
                  {availabilityError}
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="form-control-plaintext">
                  {selectedDate ? "No available slots for this date" : "Select a date to see available times"}
            </div>
              ) : (
              <select
                className="form-select"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                required
              >
                  <option value="">Choose a time...</option>
                  {availableSlots.map((time) => (
                  <option key={time} value={time}>
                    {formatTime12h(time)}
                  </option>
                ))}
              </select>
              )}
            </div>

            {/* Appointment Type */}
            <div className="col-md-6">
              <label className="form-label">Appointment Type</label>
              <select
                className="form-select"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                <option value="Video Call">Video Call</option>
                <option value="In-Person">In-Person</option>
                <option value="Phone Call">Phone Call</option>
              </select>
            </div>

            {/* Book Button */}
            <div className="col-12 d-grid">
              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading || !user || !selectedTherapist || !selectedDate || !selectedTime}
              >
                {loading ? "Booking..." : "Book Appointment"}
              </button>
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="col-12 alert alert-danger py-2">{error}</div>
            )}
            {success && (
              <div className="col-12 alert alert-success py-2">{success}</div>
            )}
          </form>
        </div>
      </div>

      {/* My Appointments */}
      <div className="card">
        <div className="card-header fw-bold">My Appointments</div>
        <div className="card-body p-0">
          <table className="table mb-0">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Therapist</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center">
                    No appointments found.
                  </td>
                </tr>
              )}
              {appointments.map((a) => (
                <tr key={a._id}>
                  <td>{new Date(a.date).toLocaleString()}</td>
                  <td>
                    {a.therapist?.name || getTherapistName(a.therapist)} 
                    {a.therapist?.email && ` (${a.therapist.email})`}
                  </td>
                  <td>{a.type || "Video Call"}</td>
                  <td>
                    <span className={`badge ${
                      a.status === 'accepted' ? 'bg-success' :
                      a.status === 'rejected' ? 'bg-danger' :
                      a.status === 'completed' ? 'bg-info' :
                      'bg-warning'
                    }`}>
                      {a.status || 'pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Appointments;
