import { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import LeftSidebar from "../components/LeftSidebar";
import { getProfile } from "../services/profileService";
import { getEvents, createEvent } from "../services/eventService";
import "../styles/Events.css";

function Events() {
  const [events, setEvents] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("explore"); // 'explore' | 'host'
  const [filterType, setFilterType] = useState("ALL"); // 'ALL' | 'HACKATHON' | 'WORKSHOP' | 'PLACEMENT'

  // Host Event Form States
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("WORKSHOP");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [registrationLink, setRegistrationLink] = useState("");
  const [registrationDetails, setRegistrationDetails] = useState("");
  const [banner, setBanner] = useState(null);
  const [hostLoading, setHostLoading] = useState(false);
  const [hostError, setHostError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfileData();
    fetchEventsData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const data = await getProfile();
      setProfile(data);
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  };

  const fetchEventsData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load events list.");
    } finally {
      setLoading(false);
    }
  };

  const handleHostSubmit = async (e) => {
    e.preventDefault();
    setHostError("");
    setHostLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("event_type", eventType);
    formData.append("description", description);
    formData.append("date", date);
    formData.append("location", location);
    formData.append("registration_deadline", registrationDeadline);
    formData.append("registration_link", registrationLink);
    formData.append("registration_details", registrationDetails);
    if (maxParticipants) {
      formData.append("max_participants", maxParticipants);
    }
    if (banner) {
      formData.append("banner", banner);
    }

    try {
      await createEvent(formData);
      // Reset form
      setTitle("");
      setEventType("WORKSHOP");
      setDescription("");
      setDate("");
      setLocation("");
      setRegistrationDeadline("");
      setMaxParticipants("");
      setRegistrationLink("");
      setRegistrationDetails("");
      setBanner(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      setActiveTab("explore");
      await fetchEventsData();
    } catch (err) {
      console.error(err);
      setHostError(err.error || "Failed to publish event.");
    } finally {
      setHostLoading(false);
    }
  };

  const formatEventDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString([], {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredEvents = events.filter((ev) => {
    if (filterType === "ALL") return true;
    return ev.event_type === filterType;
  });

  const getEventBadgeClass = (type) => {
    switch (type) {
      case "HACKATHON":
        return "badge-hackathon";
      case "WORKSHOP":
        return "badge-workshop";
      case "PLACEMENT":
        return "badge-placement";
      default:
        return "";
    }
  };

  const getEventBadgeLabel = (type) => {
    switch (type) {
      case "HACKATHON":
        return "💻 Hackathon";
      case "WORKSHOP":
        return "🎓 Workshop";
      case "PLACEMENT":
        return "💼 Placement Drive";
      default:
        return type;
    }
  };

  return (
    <div className="events-hub-layout">
      <Navbar />

      <div className="events-hub-container">
        <LeftSidebar />

        <div className="events-main-panel">
          {/* Header Card */}
          <div className="events-header-card glass-panel">
            <div className="header-text-block">
              <h1>📅 Academic & Career Event Hub</h1>
              <p>Discover placement drives, upcoming hackathons, and technical workshops happening around the campus.</p>
            </div>
            
            <div className="events-tabs">
              <button
                className={`tab-btn ${activeTab === "explore" ? "active" : ""}`}
                onClick={() => setActiveTab("explore")}
              >
                🌍 Explore Events
              </button>
              {profile && profile.is_staff && (
                <button
                  className={`tab-btn ${activeTab === "host" ? "active" : ""}`}
                  onClick={() => setActiveTab("host")}
                >
                  🎪 Host Event
                </button>
              )}
            </div>
          </div>

          {/* Tab 1: Explore Events */}
          {activeTab === "explore" && (
            <div className="explore-events-view">
              {/* Category filters */}
              <div className="category-filters-row">
                <button
                  className={`filter-btn ${filterType === "ALL" ? "active" : ""}`}
                  onClick={() => setFilterType("ALL")}
                >
                  All Events
                </button>
                <button
                  className={`filter-btn ${filterType === "HACKATHON" ? "active" : ""}`}
                  onClick={() => setFilterType("HACKATHON")}
                >
                  💻 Hackathons
                </button>
                <button
                  className={`filter-btn ${filterType === "WORKSHOP" ? "active" : ""}`}
                  onClick={() => setFilterType("WORKSHOP")}
                >
                  🎓 Workshops
                </button>
                <button
                  className={`filter-btn ${filterType === "PLACEMENT" ? "active" : ""}`}
                  onClick={() => setFilterType("PLACEMENT")}
                >
                  💼 Placement Drives
                </button>
              </div>

              {loading ? (
                <div className="events-loader">
                  <div className="spinner"></div>
                  <p>Searching academic networks...</p>
                </div>
              ) : error ? (
                <p className="events-error-msg">{error}</p>
              ) : filteredEvents.length === 0 ? (
                <div className="empty-events-card glass-panel">
                  <p>No upcoming events match this filter category.</p>
                </div>
              ) : (
                <div className="events-grid">
                  {filteredEvents.map((ev) => {
                    const deadlinePassed = new Date() > new Date(ev.registration_deadline);

                    return (
                      <div key={ev.id} className="event-card glass-panel">
                        <div className="event-banner-container">
                          {ev.banner ? (
                            <img
                              src={ev.banner.startsWith("http") ? ev.banner : `http://127.0.0.1:8000${ev.banner}`}
                              alt={ev.title}
                              className="event-banner-img"
                            />
                          ) : (
                            <div className={`event-banner-placeholder ${ev.event_type.toLowerCase()}`}>
                              <span>{getEventBadgeLabel(ev.event_type)}</span>
                            </div>
                          )}
                          <span className={`event-card-type-badge ${getEventBadgeClass(ev.event_type)}`}>
                            {getEventBadgeLabel(ev.event_type)}
                          </span>
                        </div>

                        <div className="event-card-body">
                          <h3>{ev.title}</h3>
                          <p className="event-card-desc">{ev.description}</p>

                          <div className="event-meta-info">
                            <div className="meta-item">
                              📅 <span>{formatEventDate(ev.date)}</span>
                            </div>
                            <div className="meta-item">
                              📍 <span>{ev.location}</span>
                            </div>
                            <div className="meta-item text-deadline">
                              ⏰ <span>Deadline: {formatEventDate(ev.registration_deadline)}</span>
                            </div>
                            {ev.max_participants && (
                              <div className="meta-item text-spots">
                                👥 <span>Max Capacity: {ev.max_participants} students</span>
                              </div>
                            )}
                          </div>

                          {/* Registration details block */}
                          <div className="event-registration-details-box">
                            {ev.registration_details && (
                              <div className="registration-instructions-text">
                                <strong>📝 How to Register:</strong>
                                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                                  {ev.registration_details}
                                </p>
                              </div>
                            )}

                            {ev.registration_link && (
                              <a
                                href={ev.registration_link.startsWith("http") ? ev.registration_link : `https://${ev.registration_link}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary external-reg-link-btn"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  textDecoration: 'none',
                                  width: '100%',
                                  padding: '10px',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  fontWeight: '700',
                                  marginTop: '10px',
                                  textAlign: 'center'
                                }}
                              >
                                🌐 Go to Registration Form
                              </a>
                            )}

                            {!ev.registration_link && !ev.registration_details && (
                              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center' }}>
                                Contact host for registration details.
                              </p>
                            )}

                            {deadlinePassed && (
                              <p style={{ color: 'var(--neon-rose)', fontSize: '11px', fontWeight: '700', textAlign: 'center', marginTop: '8px' }}>
                                ⚠️ Deadline Passed. Registration may be closed.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Host Event (Admin) */}
          {activeTab === "host" && profile && profile.is_staff && (
            <div className="host-event-view glass-panel">
              {/* Guidance Notice Panel */}
              <div className="admin-guidance-panel" style={{
                background: 'rgba(24, 119, 242, 0.04)',
                border: '1px solid rgba(24, 119, 242, 0.12)',
                borderRadius: '8px',
                padding: '18px',
                marginBottom: '24px'
              }}>
                <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--accent-primary)' }}>
                  📖 How to Post an Event:
                </h4>
                <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  <li>Fill in the event name, category type, scheduled date, and venue location details.</li>
                  <li>Write a clear description covering schedule, eligibility criteria, and requirements.</li>
                  <li>Optionally attach a custom event banner image (ideal resolution: 1200x600).</li>
                  <li><strong>Provide registration steps</strong>: Add a URL (e.g. Google Form or registration page) and clear instructions (e.g. fees, document uploads).</li>
                  <li>Click <strong>Publish Event</strong>. It will be instantly listed in the Event Hub for all students.</li>
                </ol>
              </div>

              <h2>🎪 Host Event</h2>
              {hostError && <p className="host-error-msg">{hostError}</p>}

              <form onSubmit={handleHostSubmit} className="host-form">
                <div className="form-group-row">
                  <div className="form-group">
                    <label>Event Title</label>
                    <input
                      type="text"
                      placeholder="e.g. StudyPulse Spring Hackathon"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Event Type</label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                    >
                      <option value="HACKATHON">Hackathon</option>
                      <option value="WORKSHOP">Workshop / Guest Lecture</option>
                      <option value="PLACEMENT">Placement Drive</option>
                    </select>
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>Location / Venue Link</label>
                    <input
                      type="text"
                      placeholder="e.g. Lab 3, CSE Block or Zoom Link"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Maximum Attendees (Optional)</label>
                    <input
                      type="number"
                      placeholder="e.g. 50 (leave blank for unlimited)"
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(e.target.value)}
                      min="1"
                    />
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>Event Date & Time</label>
                    <input
                      type="datetime-local"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Registration Deadline</label>
                    <input
                      type="datetime-local"
                      value={registrationDeadline}
                      onChange={(e) => setRegistrationDeadline(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>Registration Link URL (Optional)</label>
                    <input
                      type="url"
                      placeholder="e.g. https://forms.gle/xyz"
                      value={registrationLink}
                      onChange={(e) => setRegistrationLink(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Registration Deadline & Instructions Details (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Fill Form, bring college ID, open to CSE students..."
                      value={registrationDetails}
                      onChange={(e) => setRegistrationDetails(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Event Details & Description</label>
                  <textarea
                    placeholder="Write details about the schedule, requirements, syllabus, eligibility..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Banner Image (Optional)</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={(e) => setBanner(e.target.files[0])}
                  />
                </div>

                <button type="submit" className="btn-primary publish-submit-btn" disabled={hostLoading}>
                  {hostLoading ? "Publishing Event..." : "Publish Event 🚀"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Events;
