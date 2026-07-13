import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import FollowUsersModal from "../components/FollowUsersModal";
import { getProfile, updateProfile, removeProfilePicture } from "../services/profileService";
import { getFeed, getSavedPosts } from "../services/postService";
import {
  followUser,
  unfollowUser,
  getPendingFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
  getFollowStatus,
} from "../services/followService";
import "../styles/Profile.css";

function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const targetUsername = queryParams.get("username") || "";

  const [profile, setProfile] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState("");
  
  // Edit form states
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [department, setDepartment] = useState("");
  const [skills, setSkills] = useState("");
  const [image, setImage] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Tab & lists state
  const [activeTab, setActiveTab] = useState("posts"); // 'posts' | 'saved'
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // Follow states
  const [followRequests, setFollowRequests] = useState([]);
  const [followStatus, setFollowStatus] = useState({
    is_following: false,
    pending_sent: false,
    pending_received: false,
    request_id: null,
  });
  const [followLoading, setFollowLoading] = useState(false);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Followers");
  const [isAvatarZoomed, setIsAvatarZoomed] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [targetUsername]);

  useEffect(() => {
    if (profile) {
      loadTabData();
    }
  }, [profile, activeTab]);

  const loadProfile = async () => {
    setError("");
    try {
      // 1. Fetch own profile to know logged in user identity
      let me = loggedInUser;
      if (!me) {
        me = await getProfile();
        setLoggedInUser(me);
      }

      // 2. Fetch target profile
      const data = await getProfile(targetUsername);
      setProfile(data);
      setName(data.name || "");
      setBio(data.bio || "");
      setDepartment(data.department || "");
      setSkills(data.skills || "");
      setEditMode(false);

      // 3. Check follow states / requests
      const isOwnProfile = !targetUsername || targetUsername === me.username;
      if (isOwnProfile) {
        const reqs = await getPendingFollowRequests();
        setFollowRequests(reqs);
      } else {
        const status = await getFollowStatus(data.username);
        setFollowStatus(status);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load profile details.");
    }
  };

  const loadTabData = async () => {
    if (!profile) return;
    const isOwnProfile = !targetUsername || targetUsername === loggedInUser?.username;
    
    setPostsLoading(true);
    try {
      if (activeTab === "posts") {
        const data = await getFeed({ owner: profile.user_id });
        setPosts(data);
      } else if (isOwnProfile) {
        const data = await getSavedPosts();
        setPosts(data);
      }
    } catch (err) {
      console.error("Failed to load profile posts:", err);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!profile || followLoading) return;
    setFollowLoading(true);
    try {
      if (followStatus.is_following) {
        await unfollowUser(profile.username);
        setFollowStatus({
          is_following: false,
          pending_sent: false,
          pending_received: false,
          request_id: null,
        });
        setProfile((prev) => ({
          ...prev,
          followers_count: Math.max(0, (prev.followers_count || 1) - 1),
        }));
      } else if (followStatus.pending_sent) {
        await unfollowUser(profile.username);
        setFollowStatus({
          is_following: false,
          pending_sent: false,
          pending_received: false,
          request_id: null,
        });
      } else {
        await followUser(profile.username);
        const status = await getFollowStatus(profile.username);
        setFollowStatus(status);
      }
    } catch (err) {
      console.error(err);
      alert(err.error || "Failed to update connection status.");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      if (action === "accept") {
        await acceptFollowRequest(requestId);
        setProfile((prev) => ({
          ...prev,
          followers_count: (prev.followers_count || 0) + 1,
        }));
      } else {
        await rejectFollowRequest(requestId);
      }
      setFollowRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      console.error(err);
      alert(err.error || "Failed to process request.");
    }
  };

  const openFollowModal = (type) => {
    setModalTitle(type);
    setModalOpen(true);
  };

  const handleRemovePicture = async () => {
    if (!window.confirm("Remove your profile picture?")) return;
    try {
      const updated = await removeProfilePicture();
      setProfile(updated);
      setImage(null);
    } catch (err) {
      console.error(err);
      alert("Failed to remove profile picture.");
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("bio", bio);
    formData.append("department", department);
    formData.append("skills", skills);

    if (image) {
      formData.append("profile_picture", image);
    }

    try {
      const updated = await updateProfile(formData);
      setProfile(updated);
      setEditMode(false);
      setImage(null);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      setError("Failed to save profile changes.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handlePostDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleSaveToggle = (postId, isSaved) => {
    if (activeTab === "saved" && !isSaved) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    }
  };

  if (error && !profile) {
    return (
      <>
        <Navbar />
        <div className="profile-container error-view">
          <div className="glass-panel error-card">
            <p>{error}</p>
            <button className="btn-primary" onClick={loadProfile}>Retry</button>
          </div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Navbar />
        <div className="profile-container loading-view">
          <div className="spinner"></div>
          <p>Retrieving user profile...</p>
        </div>
      </>
    );
  }

  const isOwnProfile = !targetUsername || targetUsername === loggedInUser?.username;

  return (
    <>
      <Navbar />

      <div className="profile-container">
        {/* Profile Card Summary */}
        <div className="profile-dashboard-card glass-panel">
          {!editMode ? (
            /* VIEW MODE */
            <div className="profile-detail-grid">
              <div className="profile-left-col">
                {profile.profile_picture ? (
                  <img
                    src={`https://knowdle-site.onrender.com${profile.profile_picture}`}
                    className="profile-dash-avatar"
                    alt="Profile"
                    onClick={() => setIsAvatarZoomed(true)}
                    style={{ cursor: "zoom-in" }}
                  />
                ) : (
                  <div className="profile-dash-avatar-placeholder">👤</div>
                )}
                {isOwnProfile ? (
                  <button className="btn-secondary edit-toggle-btn" onClick={() => setEditMode(true)}>
                    ✏️ Edit Profile
                  </button>
                ) : (
                  <button
                    className={`follow-toggle-btn btn-primary ${
                      followStatus.is_following
                        ? "unfollow"
                        : followStatus.pending_sent
                        ? "requested"
                        : ""
                    }`}
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    style={{ marginTop: "12px", width: "100%" }}
                  >
                    {followStatus.is_following
                      ? "Unfollow"
                      : followStatus.pending_sent
                      ? "Requested"
                      : "Follow"}
                  </button>
                )}
              </div>

              <div className="profile-right-col">
                <div className="profile-title-row">
                  <h2>{profile.name || profile.username}</h2>
                  <span className="profile-username-tag">@{profile.username}</span>
                </div>

                {profile.department && (
                  <p className="profile-dept">🎓 {profile.department} Department</p>
                )}

                {profile.bio && <p className="profile-bio-text">"{profile.bio}"</p>}

                {profile.skills && (
                  <div className="profile-skills-list">
                    <h4>Skills:</h4>
                    <div className="skills-tags">
                      {profile.skills.split(",").map((s, idx) => (
                        <span key={idx} className="skill-tag-badge">
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="profile-counters">
                  <div className="counter-item" onClick={() => openFollowModal("Followers")} style={{ cursor: "pointer" }}>
                    <span className="counter-num">{profile.followers_count ?? 0}</span>
                    <span className="counter-lbl">Followers</span>
                  </div>
                  <div className="counter-item" onClick={() => openFollowModal("Following")} style={{ cursor: "pointer" }}>
                    <span className="counter-num">{profile.following_count ?? 0}</span>
                    <span className="counter-lbl">Following</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* EDIT MODE FORM */
            <form className="profile-edit-form" onSubmit={handleSubmit}>
              <h3>Edit Profile Workspace</h3>
              
              {error && <p className="form-error-msg">{error}</p>}

              <div className="form-avatar-section">
                {profile.profile_picture ? (
                  <div className="edit-avatar-preview-box">
                    <img
                      src={`https://knowdle-site.onrender.com${profile.profile_picture}`}
                      className="profile-dash-avatar mini"
                      alt="Current Avatar"
                    />
                    <button
                      type="button"
                      className="btn-danger-remove"
                      onClick={handleRemovePicture}
                    >
                      Remove Current Photo 🗑️
                    </button>
                  </div>
                ) : (
                  <div className="profile-dash-avatar-placeholder mini">👤</div>
                )}

                <div className="file-upload-input-group">
                  <label>Upload New Picture</label>
                  <input type="file" onChange={handleImageChange} accept="image/*" />
                </div>
              </div>

              <div className="form-inputs-grid">
                <div className="edit-input-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g. Jane Doe"
                  />
                </div>

                <div className="edit-input-group">
                  <label>Department / Major</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="E.g. Computer Science"
                  />
                </div>

                <div className="edit-input-group full-width">
                  <label>Bio (Short Description)</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Share something about yourself..."
                    rows={3}
                  />
                </div>

                <div className="edit-input-group full-width">
                  <label>Skills (Comma-separated)</label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="Python, React, Data Structures, Writing"
                  />
                </div>
              </div>

              <div className="edit-actions-row">
                <button type="submit" className="btn-primary" disabled={submitLoading}>
                  {submitLoading ? "Saving Changes..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEditMode(false);
                    setError("");
                  }}
                  disabled={submitLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Pending Follow Requests Card (for own profile) */}
        {isOwnProfile && followRequests.length > 0 && (
          <div className="follow-requests-card glass-panel">
            <h3>🔔 Pending Connection Requests ({followRequests.length})</h3>
            <div className="follow-requests-list">
              {followRequests.map((req) => (
                <div key={req.id} className="follow-request-item">
                  <div className="request-sender-info" onClick={() => navigate(`/profile?username=${req.sender.username}`)} style={{ cursor: "pointer" }}>
                    <img
                      src={
                        req.sender.profile_picture
                          ? `https://knowdle-site.onrender.com${req.sender.profile_picture}`
                          : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23e4e6eb'/><circle cx='50' cy='35' r='20' fill='%238a8d91'/><path d='M20,80 C20,60 80,60 80,80' fill='%238a8d91'/></svg>"
                      }
                      alt={req.sender.username}
                      className="request-sender-avatar"
                    />
                    <div className="request-sender-details">
                      <span className="request-sender-username">@{req.sender.username}</span>
                      {req.sender.name && <span className="request-sender-name">{req.sender.name}</span>}
                    </div>
                  </div>
                  <div className="request-actions">
                    <button className="btn-accept" onClick={() => handleRequestAction(req.id, "accept")}>
                      Accept
                    </button>
                    <button className="btn-reject" onClick={() => handleRequestAction(req.id, "reject")}>
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab System for User Posts */}
        <div className="profile-tabs-card glass-panel">
          <div className="profile-tab-headers">
            <button
              className={`tab-hdr-btn ${activeTab === "posts" ? "active" : ""}`}
              onClick={() => setActiveTab("posts")}
            >
              {isOwnProfile ? "My Posts" : "Posts"} ({activeTab === "posts" && !postsLoading ? posts.length : "..."})
            </button>
            {isOwnProfile && (
              <button
                className={`tab-hdr-btn ${activeTab === "saved" ? "active" : ""}`}
                onClick={() => setActiveTab("saved")}
              >
                Saved Posts ({activeTab === "saved" && !postsLoading ? posts.length : "..."})
              </button>
            )}
          </div>

          <div className="profile-tab-content">
            {postsLoading ? (
              <div className="profile-posts-loading">
                <div className="spinner"></div>
                <p>Loading posts list...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="profile-posts-empty">
                <p>
                  {activeTab === "posts"
                    ? (isOwnProfile ? "You haven't posted anything yet. Share your first post!" : "This user hasn't posted anything yet.")
                    : "No saved posts found. Bookmark posts from your feed!"}
                </p>
              </div>
            ) : (
              <div className="profile-posts-grid">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onDelete={handlePostDelete}
                    onSaveToggle={handleSaveToggle}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Followers / Following popup Modal */}
      {profile && (
        <FollowUsersModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={modalTitle}
          username={profile.username}
        />
      )}

      {/* WhatsApp-style avatar zoom lightbox */}
      {isAvatarZoomed && profile && profile.profile_picture && (
        <div className="avatar-lightbox-overlay" onClick={() => setIsAvatarZoomed(false)}>
          <div className="avatar-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="avatar-lightbox-header">
              <span className="lightbox-user-name">{profile.name || profile.username}</span>
              <button className="lightbox-close-btn" onClick={() => setIsAvatarZoomed(false)}>✕</button>
            </div>
            <img
              src={`https://knowdle-site.onrender.com${profile.profile_picture}`}
              alt="Zoomed Profile"
              className="avatar-lightbox-img"
            />
          </div>
        </div>
      )}
    </>
  );
}

export default Profile;
