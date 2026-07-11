import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import LeftSidebar from "../components/LeftSidebar";
import {
  getTeams,
  createTeam,
  getTeamRequests,
  acceptTeamRequest,
  rejectTeamRequest,
} from "../services/teamService";
import "../styles/Teams.css";

function Teams() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [error, setError] = useState("");

  // Create team form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [teamType, setTeamType] = useState("STUDY");
  const [logoFile, setLogoFile] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [zoomedLogo, setZoomedLogo] = useState(null);

  useEffect(() => {
    fetchTeamsData();
  }, []);

  const fetchTeamsData = async () => {
    setLoading(true);
    setError("");
    try {
      const teamsData = await getTeams();
      setTeams(teamsData);
      await fetchRequests();
    } catch (err) {
      console.error(err);
      setError("Failed to load teams. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    setRequestsLoading(true);
    try {
      const reqData = await getTeamRequests();
      setInvitations(reqData.invitations || []);
      setJoinRequests(reqData.join_requests || []);
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setCreateError("Team Name is required.");
      return;
    }
    setCreateLoading(true);
    setCreateError("");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("team_type", teamType);
    if (logoFile) {
      formData.append("team_logo", logoFile);
    }

    try {
      const newTeam = await createTeam(formData);
      setTeams((prev) => [newTeam, ...prev]);
      setName("");
      setDescription("");
      setTeamType("STUDY");
      setLogoFile(null);
      setShowCreateModal(false);
    } catch (err) {
      console.error(err);
      setCreateError(err.error || "Failed to create team.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      if (action === "accept") {
        await acceptTeamRequest(requestId);
      } else {
        await rejectTeamRequest(requestId);
      }
      // Reload teams list and requests panel
      const teamsData = await getTeams();
      setTeams(teamsData);
      await fetchRequests();
    } catch (err) {
      console.error(`Failed to ${action} request:`, err);
      alert(err.error || `Failed to ${action} request.`);
    }
  };

  const getTeamTypeIcon = (type) => {
    switch (type) {
      case "FRIENDS":
        return "👥";
      case "STUDY":
        return "📚";
      case "PROFESSIONAL":
        return "💼";
      default:
        return "👥";
    }
  };

  const getTeamTypeLabel = (type) => {
    switch (type) {
      case "FRIENDS":
        return "Friends Group";
      case "STUDY":
        return "Study Team";
      case "PROFESSIONAL":
        return "Professional Team";
      default:
        return type;
    }
  };

  return (
    <>
      <Navbar />

      <div className="feed-layout">
        <LeftSidebar />

        <div className="feed-content-area">
          <div className="teams-dashboard-header glass-panel">
            <div>
              <h1 className="dashboard-title">Collaborative Teams</h1>
              <p className="dashboard-subtitle">
                Create or join purpose-built academic, social, or project-based circles.
              </p>
            </div>
            <button
              className="btn-primary create-team-btn"
              onClick={() => setShowCreateModal(true)}
            >
              ➕ Create Team
            </button>
          </div>

          {error && <div className="teams-error-card glass-panel">{error}</div>}

          {/* Pending Notifications Panel */}
          {(invitations.length > 0 || joinRequests.length > 0) && (
            <div className="requests-notification-panel glass-panel">
              <h3>🔔 Pending Requests</h3>
              <div className="requests-list">
                {invitations.map((inv) => (
                  <div key={inv.id} className="request-card">
                    <div className="request-info">
                      <span className="req-icon">📩</span>
                      <p>
                        <strong>@{inv.sender_details.username}</strong> invited you to join{" "}
                        <strong>{inv.team_details.name}</strong>{" "}
                        <span className="team-badge mini-badge">{inv.team_details.team_type}</span>
                      </p>
                    </div>
                    <div className="request-actions">
                      <button
                        className="btn-accept"
                        onClick={() => handleRequestAction(inv.id, "accept")}
                      >
                        Accept
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => handleRequestAction(inv.id, "reject")}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}

                {joinRequests.map((req) => (
                  <div key={req.id} className="request-card">
                    <div className="request-info">
                      <span className="req-icon">🙋‍♂️</span>
                      <p>
                        <strong>@{req.sender_details.username}</strong> requested to join your team{" "}
                        <strong>{req.team_details.name}</strong>
                      </p>
                    </div>
                    <div className="request-actions">
                      <button
                        className="btn-accept"
                        onClick={() => handleRequestAction(req.id, "accept")}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => handleRequestAction(req.id, "reject")}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Joined Teams Grid */}
          <div className="teams-grid-container">
            {loading ? (
              <div className="feed-spinner-container">
                <div className="spinner"></div>
                <p>Loading your teams...</p>
              </div>
            ) : teams.length === 0 ? (
              <div className="empty-teams-card glass-panel">
                <span className="empty-icon">👥</span>
                <h3>No Teams Joined Yet</h3>
                <p>
                  You don't belong to any team currently. Create a team above or ask friends to invite
                  you!
                </p>
              </div>
            ) : (
              <div className="teams-grid">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="team-grid-card glass-panel"
                    onClick={() => navigate(`/teams/${team.id}`)}
                  >
                    <div className="team-card-header">
                      {team.team_logo ? (
                        <img
                          src={team.team_logo.startsWith("http") ? team.team_logo : `http://127.0.0.1:8000${team.team_logo}`}
                          alt={team.name}
                          className="team-card-logo"
                          style={{ cursor: "zoom-in" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setZoomedLogo({
                              url: team.team_logo.startsWith("http") ? team.team_logo : `http://127.0.0.1:8000${team.team_logo}`,
                              name: team.name
                            });
                          }}
                        />
                      ) : (
                        <div className="team-card-logo-placeholder">
                          {getTeamTypeIcon(team.team_type)}
                        </div>
                      )}
                      <span className={`team-type-badge ${team.team_type.toLowerCase()}`}>
                        {getTeamTypeLabel(team.team_type)}
                      </span>
                    </div>

                    <h3 className="team-card-name">{team.name}</h3>
                    <p className="team-card-desc">
                      {team.description || "No description provided."}
                    </p>

                    <div className="team-card-footer">
                      <div className="team-footer-stat">
                        <span className="footer-label">Members:</span>
                        <strong className="footer-value">{team.members_count}</strong>
                      </div>
                      <div className="team-footer-stat">
                        <span className="footer-label">Owner:</span>
                        <strong className="footer-value">@{team.owner_details.username}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Team Modal Dialog */}
      {showCreateModal && (
        <div className="teams-modal-overlay">
          <div className="teams-modal-content glass-panel">
            <div className="modal-header">
              <h2>➕ Create New Team</h2>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="teams-form">
              {createError && <div className="form-error">{createError}</div>}

              <div className="form-group">
                <label>Team Name *</label>
                <input
                  type="text"
                  placeholder="Enter a descriptive team name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="What is the purpose of this team?..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Team Type</label>
                <select value={teamType} onChange={(e) => setTeamType(e.target.value)}>
                  <option value="FRIENDS">Friends Circle (Private Social)</option>
                  <option value="STUDY">Study Circle (Notes, Coding, AI)</option>
                  <option value="PROFESSIONAL">Professional Circle (Projects, Hacks)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Team Logo (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files[0])}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={createLoading}>
                  {createLoading ? "Creating..." : "Create Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* WhatsApp-style team logo zoom lightbox */}
      {zoomedLogo && (
        <div className="avatar-lightbox-overlay" onClick={() => setZoomedLogo(null)}>
          <div className="avatar-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="avatar-lightbox-header">
              <span className="lightbox-user-name">{zoomedLogo.name} (Team Logo)</span>
              <button className="lightbox-close-btn" onClick={() => setZoomedLogo(null)}>✕</button>
            </div>
            <img
              src={zoomedLogo.url}
              alt="Zoomed Team Logo"
              className="avatar-lightbox-img"
            />
          </div>
        </div>
      )}
    </>
  );
}

export default Teams;
