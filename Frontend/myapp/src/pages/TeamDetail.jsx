import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import LeftSidebar from "../components/LeftSidebar";
import PostCard from "../components/PostCard";
import { getProfile } from "../services/profileService";
import { getFeed, createPost } from "../services/postService";
import { searchUsers } from "../services/searchService";
import {
  getTeam,
  updateTeam,
  deleteTeam,
  leaveTeam,
  inviteUserToTeam,
  removeTeamMember,
  getTeamMessages,
  sendTeamMessage,
  getTeamAiSummary,
  deleteTeamMessage,
} from "../services/teamService";
import "../styles/Teams.css";

function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Core details states
  const [team, setTeam] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // Tab view toggles
  const [activeTab, setActiveTab] = useState("posts"); // 'posts' | 'chat' | 'settings'

  // Chat States
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSendLoading, setChatSendLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Chat Message Delete States
  const [activeDeleteMessage, setActiveDeleteMessage] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Invitation & member states
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  // Invite Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const inviteContainerRef = useRef(null);

  // Edit Team state
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editLogo, setEditLogo] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [isLogoZoomed, setIsLogoZoomed] = useState(false);

  // AI Summary state
  const [aiSummary, setAiSummary] = useState("");
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState("");
  const [showAiSummaryDrawer, setShowAiSummaryDrawer] = useState(false);

  // Post composer state (team-locked)
  const [caption, setCaption] = useState("");
  const [mediaType, setMediaType] = useState("TEXT");
  const [mediaFile, setMediaFile] = useState(null);
  const [postLoading, setPostLoading] = useState(false);
  const [postError, setPostError] = useState("");

  useEffect(() => {
    loadInitialData();
  }, [id]);

  // Debounce user search for invites
  useEffect(() => {
    if (!searchQuery.trim() || !team) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setSearchLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const data = await searchUsers(searchQuery);
        // Exclude profiles of users who are already members of this team
        const filtered = (data || []).filter(
          (userProfile) => !team.members_details.some((m) => m.username === userProfile.username)
        );
        setSearchResults(filtered);
        setShowSearchDropdown(true);
      } catch (err) {
        console.error("Invite search failed:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, team]);

  // Click outside to close invite search dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inviteContainerRef.current && !inviteContainerRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchChatMessages = async () => {
    try {
      const msgs = await getTeamMessages(id);
      setChatMessages(msgs);
    } catch (err) {
      console.error("Failed to load chat messages:", err);
    }
  };

  // Chat message loading & polling
  useEffect(() => {
    let intervalId;
    if (activeTab === "chat") {
      setChatLoading(true);
      fetchChatMessages().finally(() => setChatLoading(false));

      intervalId = setInterval(() => {
        fetchChatMessages();
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTab, id]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (activeTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;
    setChatSendLoading(true);
    try {
      const newMsg = await sendTeamMessage(id, newMessageText.trim());
      setChatMessages((prev) => [...prev, newMsg]);
      setNewMessageText("");
    } catch (err) {
      console.error(err);
      alert(err.error || "Failed to send message.");
    } finally {
      setChatSendLoading(false);
    }
  };

  const triggerDeleteMessage = (msg) => {
    setActiveDeleteMessage(msg);
    setShowDeleteModal(true);
  };

  const executeDeleteMessage = async (messageId, deleteType) => {
    try {
      await deleteTeamMessage(id, messageId, deleteType);
      if (deleteType === "me") {
        setChatMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      } else {
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, is_deleted: true, text: "This message was deleted" } : msg
          )
        );
      }
      setShowDeleteModal(false);
      setActiveDeleteMessage(null);
    } catch (err) {
      console.error("Delete message failed:", err);
      alert(err.error || "Failed to delete message.");
    }
  };

  const handleSelectUserToInvite = (username) => {
    setInviteUsername(username);
    setSearchQuery("");
    setShowSearchDropdown(false);
  };

  const formatChatMessageTime = (dateString) => {
    const d = new Date(dateString);
    const now = new Date();
    
    // Check if today
    const isToday = d.getDate() === now.getDate() &&
                    d.getMonth() === now.getMonth() &&
                    d.getFullYear() === now.getFullYear();
                    
    // Check if yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.getDate() === yesterday.getDate() &&
                        d.getMonth() === yesterday.getMonth() &&
                        d.getFullYear() === yesterday.getFullYear();
                        
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) {
      return `Today, ${timeStr}`;
    } else if (isYesterday) {
      return `Yesterday, ${timeStr}`;
    } else {
      const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      return `${dateStr}, ${timeStr}`;
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    setError("");
    try {
      // Get current logged-in user profile
      const prof = await getProfile();
      setCurrentUser(prof);

      // Get team details
      const teamData = await getTeam(id);
      setTeam(teamData);
      setEditName(teamData.name);
      setEditDesc(teamData.description || "");

      // Get team specific posts
      await fetchTeamPosts();
    } catch (err) {
      console.error(err);
      setError(err.error || "Failed to load team details or you do not have permission.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    setAiSummaryLoading(true);
    setAiSummaryError("");
    try {
      const result = await getTeamAiSummary(id);
      setAiSummary(result.summary);
    } catch (err) {
      console.error(err);
      setAiSummaryError(err.error || "Failed to generate AI summary.");
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const fetchTeamPosts = async () => {
    setPostsLoading(true);
    try {
      const postsData = await getFeed({ team_id: id });
      setPosts(postsData);
    } catch (err) {
      console.error("Failed to load team posts:", err);
    } finally {
      setPostsLoading(false);
    }
  };

  const handlePostCreate = async (e) => {
    e.preventDefault();
    if (!caption.trim() && !mediaFile) {
      setPostError("A post must contain either a caption or a media file.");
      return;
    }
    setPostLoading(true);
    setPostError("");

    const formData = new FormData();
    formData.append("caption", caption);
    formData.append("media_type", mediaType);
    formData.append("team", id); // Lock this post to the team!
    if (mediaFile) {
      formData.append("media_file", mediaFile);
    }

    try {
      await createPost(formData);
      setCaption("");
      setMediaFile(null);
      setMediaType("TEXT");
      const fileInput = document.getElementById("team-post-file-input");
      if (fileInput) fileInput.value = "";
      await fetchTeamPosts();
    } catch (err) {
      console.error(err);
      setPostError(err.error || "Failed to create post.");
    } finally {
      setPostLoading(false);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteUsername.trim()) return;
    setInviteLoading(true);
    setInviteError("");
    setInviteSuccess("");

    try {
      await inviteUserToTeam(id, inviteUsername.trim());
      setInviteSuccess(`Invitation sent to @${inviteUsername}!`);
      setInviteUsername("");
    } catch (err) {
      console.error(err);
      setInviteError(err.error || "Failed to send invitation.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      await removeTeamMember(id, userId);
      // Refresh team details
      const teamData = await getTeam(id);
      setTeam(teamData);
    } catch (err) {
      console.error(err);
      alert(err.error || "Failed to remove member.");
    }
  };

  const handleLeaveTeam = async () => {
    if (!window.confirm("Are you sure you want to leave this team?")) return;
    try {
      await leaveTeam(id);
      navigate("/teams");
    } catch (err) {
      console.error(err);
      alert(err.error || "Failed to leave team.");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");

    const formData = new FormData();
    formData.append("name", editName);
    formData.append("description", editDesc);
    if (editLogo) {
      formData.append("team_logo", editLogo);
    }

    try {
      const updated = await updateTeam(id, formData);
      setTeam(updated);
      setEditLogo(null);
      alert("Team details updated successfully!");
    } catch (err) {
      console.error(err);
      setEditError(err.error || "Failed to update team details.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (
      !window.confirm("WARNING: Are you absolutely sure you want to DELETE this team? This action is permanent.")
    ) {
      return;
    }
    try {
      await deleteTeam(id);
      navigate("/teams");
    } catch (err) {
      console.error(err);
      alert(err.error || "Failed to delete team.");
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

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="feed-layout">
          <LeftSidebar />
          <div className="feed-content-area">
            <div className="feed-spinner-container">
              <div className="spinner"></div>
              <p>Loading team workspace...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !team) {
    return (
      <>
        <Navbar />
        <div className="feed-layout">
          <LeftSidebar />
          <div className="feed-content-area">
            <div className="teams-error-card glass-panel">
              <h3>⚠️ Error</h3>
              <p>{error || "Team not found or access denied."}</p>
              <button className="btn-primary" onClick={() => navigate("/teams")} style={{ marginTop: "15px" }}>
                Back to Teams
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const isOwner = team.owner === currentUser?.user_id;

  return (
    <>
      <Navbar />

      <div className="feed-layout">
        <LeftSidebar />

        <div className="feed-content-area team-detail-layout">
          {/* Back button */}
          <button className="back-feed-btn" onClick={() => navigate("/teams")}>
            ← Back to Teams
          </button>

          {/* Team Cover/Header Banner */}
          <div className="team-detail-header glass-panel">
            <div className="team-header-identity">
              {team.team_logo ? (
                <img
                  src={team.team_logo.startsWith("http") ? team.team_logo : `http://127.0.0.1:8000${team.team_logo}`}
                  alt={team.name}
                  className="team-header-logo"
                  style={{ cursor: "zoom-in" }}
                  onClick={() => setIsLogoZoomed(true)}
                />
              ) : (
                <div className="team-header-logo-placeholder">
                  {getTeamTypeIcon(team.team_type)}
                </div>
              )}
              <div className="team-header-text">
                <div className="team-title-row">
                  <h1 className="team-name-title">{team.name}</h1>
                  <span className={`team-type-badge ${team.team_type.toLowerCase()}`}>
                    {team.team_type}
                  </span>
                </div>
                <p className="team-description-subtitle">
                  {team.description || "No description provided."}
                </p>
                <div className="team-meta-row">
                  <span>Owner: <strong>@{team.owner_details.username}</strong></span>
                  <span className="dot-divider">•</span>
                  <span>Members: <strong>{team.members_count}</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Action buttons */}
            <div className="team-header-actions">
              {isOwner ? (
                <button className="btn-danger-outline" onClick={handleDeleteTeam}>
                  🗑️ Delete Team
                </button>
              ) : (
                <button className="btn-danger-outline" onClick={handleLeaveTeam}>
                  🏃‍♂️ Leave Team
                </button>
              )}
            </div>
          </div>

          {/* Workspace Sections Tabs */}
          <div className="team-workspace-tabs glass-panel">
            <button
              className={`workspace-tab ${activeTab === "posts" ? "active" : ""}`}
              onClick={() => setActiveTab("posts")}
            >
              📝 Workspace Feed
            </button>
            <button
              className={`workspace-tab ${activeTab === "chat" ? "active" : ""}`}
              onClick={() => setActiveTab("chat")}
            >
              💬 Group Chat
            </button>
            {isOwner && (
              <button
                className={`workspace-tab ${activeTab === "settings" ? "active" : ""}`}
                onClick={() => setActiveTab("settings")}
              >
                ⚙️ Settings
              </button>
            )}
          </div>

          {/* Left panel & right sidebar grid */}
          <div className="team-workspace-grid">
            <div className="team-workspace-left">
              {activeTab === "posts" && (
                <>
                  {/* Create post form locked to team */}
                  <div className="post-creator-box glass-panel">
                    <form onSubmit={handlePostCreate}>
                      {postError && <div className="post-error">{postError}</div>}
                      <div className="creator-input-row">
                        <textarea
                          placeholder={`Post a task update or academic topic in ${team.name}...`}
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          rows={3}
                          disabled={postLoading}
                        />
                      </div>

                      <div className="creator-actions-row">
                        <div className="media-upload-options">
                          <label className="media-upload-btn">
                            📎 Attach Media
                            <input
                              type="file"
                              id="team-post-file-input"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                setMediaFile(file);
                                if (file) {
                                  // Auto-detect type
                                  if (file.type.startsWith("image/")) setMediaType("IMAGE");
                                  else if (file.type.startsWith("video/")) setMediaType("VIDEO");
                                  else setMediaType("TEXT");
                                }
                              }}
                              disabled={postLoading}
                            />
                          </label>

                          {mediaFile && (
                            <span className="media-file-indicator">
                              📂 {mediaFile.name.substring(0, 15)}...
                            </span>
                          )}
                        </div>

                        <button type="submit" className="btn-primary" disabled={postLoading}>
                          {postLoading ? "Publishing..." : "Post to Team 🚀"}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Team-locked feed list */}
                  <div className="posts-feed-list">
                    {postsLoading ? (
                      <div className="feed-spinner-container">
                        <div className="spinner"></div>
                        <p>Updating feed list...</p>
                      </div>
                    ) : posts.length === 0 ? (
                      <div className="empty-feed-card glass-panel">
                        <p>No posts published in this team yet. Start the conversation!</p>
                      </div>
                    ) : (
                      posts.map((post) => (
                        <PostCard key={post.id} post={post} onDelete={fetchTeamPosts} />
                      ))
                    )}
                  </div>
                </>
              )}

              {activeTab === "chat" && (
                <div className="chat-interface-panel glass-panel">
                  <div className="chat-messages-container">
                    {chatLoading ? (
                      <div className="chat-spinner-container">
                        <div className="spinner"></div>
                        <p>Loading chat history...</p>
                      </div>
                    ) : chatMessages.length === 0 ? (
                      <div className="empty-chat-message">
                        <span className="chat-bubble-icon">💬</span>
                        <h3>Welcome to the Team Chat!</h3>
                        <p>No messages have been sent yet. Introduce yourself to start collaborating!</p>
                      </div>
                    ) : (
                      chatMessages.map((msg) => {
                        const isMsgSenderMe = msg.sender === currentUser?.user_id;
                        return (
                          <div key={msg.id} className={`chat-message-bubble ${isMsgSenderMe ? "me" : "others"}`}>
                            <img
                              src={
                                msg.sender_details?.profile_picture
                                  ? `http://127.0.0.1:8000${msg.sender_details.profile_picture}`
                                  : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23e4e6eb'/><circle cx='50' cy='35' r='20' fill='%238a8d91'/><path d='M20,80 C20,60 80,60 80,80' fill='%238a8d91'/></svg>"
                              }
                              alt={msg.sender_details?.username}
                              className="chat-message-avatar"
                            />
                            <div className="chat-message-content" style={msg.is_deleted ? { border: '1px dashed rgba(0, 0, 0, 0.08)', background: 'rgba(0, 0, 0, 0.01)', padding: '8px 12px', borderRadius: '8px' } : {}}>
                              <span className="chat-message-author">
                                {msg.sender_details?.name || msg.sender_details?.username || "student"}
                              </span>
                              {msg.is_deleted ? (
                                <p className="chat-message-text deleted-message-text" style={{ fontStyle: "italic", color: "var(--text-secondary)", display: 'flex', alignItems: 'center', gap: '6px', margin: '4px 0' }}>
                                  🚫 {isMsgSenderMe 
                                    ? "You deleted this message" 
                                    : `${msg.sender_details?.name || msg.sender_details?.username} deleted this message`
                                  }
                                </p>
                              ) : (
                                <p className="chat-message-text">{msg.text}</p>
                              )}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '2px' }}>
                                <span className="chat-message-time">
                                  {formatChatMessageTime(msg.created_at)}
                                </span>
                                {(isMsgSenderMe || isOwner || msg.is_deleted) && (
                                  <button 
                                    className="chat-message-delete-btn" 
                                    onClick={() => triggerDeleteMessage(msg)} 
                                    title="Delete message"
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      fontSize: '11px',
                                      opacity: 0.5,
                                      transition: 'opacity 0.2s',
                                      padding: 0
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                                  >
                                    🗑️
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <form onSubmit={handleSendChatMessage} className="chat-input-bar">
                    <input
                      type="text"
                      placeholder="Type a message to your team..."
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      disabled={chatSendLoading}
                      maxLength={1000}
                      required
                    />
                    <button type="submit" className="btn-primary chat-send-btn" disabled={chatSendLoading}>
                      Send
                    </button>
                  </form>
                </div>
              )}

              {activeTab === "settings" && isOwner && (
                <div className="team-settings-container glass-panel">
                  <h2>⚙️ Edit Team Details</h2>
                  <form onSubmit={handleEditSubmit} className="teams-form">
                    {editError && <div className="form-error">{editError}</div>}

                    <div className="form-group">
                      <label>Team Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className="form-group">
                      <label>Update Logo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setEditLogo(e.target.files[0])}
                      />
                    </div>

                    <button type="submit" className="btn-primary" disabled={editLoading}>
                      {editLoading ? "Saving..." : "Save Changes"}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Right sidebar: members list & invite box */}
            <div className="team-workspace-right">
              {/* Invite User Card */}
              <div className="team-invite-card glass-panel" ref={inviteContainerRef}>
                <h3>🙋‍♂️ Invite Member</h3>
                <form onSubmit={handleInviteSubmit} className="invite-form">
                  {inviteError && <div className="invite-error">{inviteError}</div>}
                  {inviteSuccess && <div className="invite-success">{inviteSuccess}</div>}

                  <div className="invite-search-container">
                    <input
                      type="text"
                      placeholder="Search students to invite..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => {
                        if (searchQuery.trim()) setShowSearchDropdown(true);
                      }}
                      disabled={inviteLoading}
                    />
                    {searchLoading && <span className="invite-search-spinner">⏳</span>}

                    {showSearchDropdown && searchResults.length > 0 && (
                      <div className="invite-dropdown">
                        {searchResults.map((user) => (
                          <div
                            key={user.id}
                            className="invite-dropdown-item"
                            onClick={() => handleSelectUserToInvite(user.username)}
                          >
                            <img
                              src={
                                user.profile_picture
                                  ? `http://127.0.0.1:8000${user.profile_picture}`
                                  : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23e4e6eb'/><circle cx='50' cy='35' r='20' fill='%238a8d91'/><path d='M20,80 C20,60 80,60 80,80' fill='%238a8d91'/></svg>"
                              }
                              alt={user.username}
                              className="invite-dropdown-avatar"
                            />
                            <span className="invite-dropdown-username">@{user.username}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {inviteUsername && (
                    <div className="invite-selected-indicator">
                      <span>Selected: <strong>@{inviteUsername}</strong></span>
                      <button
                        type="button"
                        className="btn-clear-invite-selection"
                        onClick={() => setInviteUsername("")}
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn-primary invite-submit-btn"
                    disabled={inviteLoading || !inviteUsername}
                  >
                    {inviteLoading ? "Sending..." : "Send Invite"}
                  </button>
                </form>
              </div>

              {/* Members List Card */}
              <div className="team-members-card glass-panel">
                <h3>👥 Team Members ({team.members_details.length})</h3>
                <div className="members-list">
                  {team.members_details.map((member) => {
                    const memberIsOwner = team.owner === member.id;
                    return (
                      <div key={member.id} className="member-item">
                        <div className="member-identity">
                          <img
                            src={
                              member.profile_picture
                                ? `http://127.0.0.1:8000${member.profile_picture}`
                                : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23e4e6eb'/><circle cx='50' cy='35' r='20' fill='%238a8d91'/><path d='M20,80 C20,60 80,60 80,80' fill='%238a8d91'/></svg>"
                            }
                            alt={member.username}
                            className="member-avatar"
                          />
                          <div className="member-names">
                            <span className="member-username">{member.name || member.username}</span>
                            {member.name && <span className="member-name">@{member.username}</span>}
                          </div>
                        </div>

                        {memberIsOwner ? (
                          <span className="owner-tag-badge">Owner</span>
                        ) : (
                          isOwner && (
                            <button
                              className="btn-remove-member"
                              onClick={() => handleRemoveMember(member.id)}
                              title="Remove member"
                            >
                              ✕
                            </button>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* WhatsApp-style team logo zoom lightbox */}
      {isLogoZoomed && team && team.team_logo && (
        <div className="avatar-lightbox-overlay" onClick={() => setIsLogoZoomed(false)}>
          <div className="avatar-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="avatar-lightbox-header">
              <span className="lightbox-user-name">{team.name} (Team Logo)</span>
              <button className="lightbox-close-btn" onClick={() => setIsLogoZoomed(false)}>✕</button>
            </div>
            <img
              src={team.team_logo.startsWith("http") ? team.team_logo : `http://127.0.0.1:8000${team.team_logo}`}
              alt="Zoomed Team Logo"
              className="avatar-lightbox-img"
            />
          </div>
        </div>
      )}
      {/* Sliding Drawer for AI Workspace Summary */}
      <div className={`team-ai-summary-drawer glass-panel ${showAiSummaryDrawer ? "open" : ""}`}>
        <div className="drawer-header">
          <h3>🤖 AI Workspace Summary</h3>
          <button className="drawer-close-btn" onClick={() => setShowAiSummaryDrawer(false)}>✕</button>
        </div>

        <div className="drawer-body">
          {aiSummary ? (
            <div className="ai-summary-content">
              <pre className="ai-summary-text">{aiSummary}</pre>
              <button
                className="btn-secondary regen-summary-btn"
                onClick={handleGenerateSummary}
                disabled={aiSummaryLoading}
                style={{ marginTop: '16px', width: '100%', fontSize: '13px' }}
              >
                {aiSummaryLoading ? "Regenerating..." : "🔄 Regenerate Summary"}
              </button>
            </div>
          ) : (
            <div className="ai-summary-empty" style={{ padding: '20px 0', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                Analyze and summarize the recent 20 posts in this workspace based on the team's purpose ({team?.team_type}).
              </p>
              <button
                className="btn-primary generate-summary-btn"
                onClick={handleGenerateSummary}
                disabled={aiSummaryLoading}
                style={{ width: '100%' }}
              >
                {aiSummaryLoading ? "Generating..." : "✨ Generate Summary"}
              </button>
            </div>
          )}
          
          {aiSummaryError && (
            <p style={{ color: 'var(--neon-rose)', fontSize: '12px', marginTop: '12px', textAlign: 'center' }}>
              {aiSummaryError}
            </p>
          )}
        </div>
      </div>

      {/* Floating Action Button (FAB) to toggle Drawer */}
      <button
        className="team-ai-summary-fab"
        onClick={() => setShowAiSummaryDrawer(true)}
        title="Open AI Team Summary"
      >
        🤖 <span className="fab-label">AI Summary</span>
      </button>

      {/* WhatsApp-style Delete Choice Modal */}
      {showDeleteModal && activeDeleteMessage && (() => {
        const ageMs = Date.now() - new Date(activeDeleteMessage.created_at).getTime();
        const isUnder12Hours = ageMs < 12 * 60 * 60 * 1000;
        const isMsgSenderMe = activeDeleteMessage.sender === currentUser?.user_id;
        const isOwner = team.owner === currentUser?.user_id;
        const canDeleteForEveryone = !activeDeleteMessage.is_deleted && isUnder12Hours && (isMsgSenderMe || isOwner);

        return (
          <div className="share-event-modal-overlay" style={{ zIndex: 3000 }} onClick={() => { setShowDeleteModal(false); setActiveDeleteMessage(null); }}>
            <div className="share-event-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '380px', padding: '24px', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: 'var(--text-primary)' }}>Delete Message?</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
                {canDeleteForEveryone 
                  ? "Would you like to delete this message for yourself or for everyone in the group?"
                  : activeDeleteMessage.is_deleted 
                    ? "Are you sure you want to delete this message notice for yourself?"
                    : "Are you sure you want to delete this message for yourself?"
                }
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {canDeleteForEveryone && (
                  <button 
                    type="button" 
                    className="btn-primary" 
                    onClick={() => executeDeleteMessage(activeDeleteMessage.id, "everyone")}
                    style={{ width: '100%', background: 'var(--neon-rose)', border: 'none', padding: '10px 0', borderRadius: '6px', fontWeight: '700', color: 'white' }}
                  >
                    Delete for Everyone
                  </button>
                )}
                <button 
                  type="button" 
                  className={`btn-primary ${canDeleteForEveryone ? 'btn-secondary' : ''}`} 
                  onClick={() => executeDeleteMessage(activeDeleteMessage.id, "me")}
                  style={{ 
                    width: '100%', 
                    padding: '10px 0', 
                    borderRadius: '6px',
                    background: canDeleteForEveryone ? 'none' : 'var(--accent-primary)',
                    border: canDeleteForEveryone ? '1px solid var(--border-color)' : 'none',
                    color: canDeleteForEveryone ? 'var(--text-primary)' : 'white',
                    fontWeight: canDeleteForEveryone ? 'normal' : '700'
                  }}
                >
                  Delete for Me
                </button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => { setShowDeleteModal(false); setActiveDeleteMessage(null); }}
                  style={{ width: '100%', padding: '10px 0', borderRadius: '6px', border: 'none', background: 'none', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}

export default TeamDetail;
