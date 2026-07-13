import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { followUser, unfollowUser } from "../services/followService.jsx";

function ProfileCard({ user, followingList = [], onFollowToggle }) {
  const navigate = useNavigate();
  const currentUsername = localStorage.getItem("username");
  const [isFollowing, setIsFollowing] = useState(
    followingList.includes(user.username)
  );
  const [requestSent, setRequestSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsFollowing(followingList.includes(user.username));
  }, [user, followingList]);

  const handleFollowToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(user.username);
        setIsFollowing(false);
        if (onFollowToggle) onFollowToggle(user.username, false);
      } else if (requestSent) {
        await unfollowUser(user.username);
        setRequestSent(false);
      } else {
        await followUser(user.username);
        setRequestSent(true);
      }
    } catch (err) {
      console.error("Follow toggle failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `http://127.0.0.1:8000${path}`;
  };

  const isMe = user.username === currentUsername;

  const handleProfileClick = () => {
    navigate(`/profile?username=${user.username}`);
  };

  return (
    <div className="profile-search-card glass-panel">
      <div className="profile-search-header">
        <div onClick={handleProfileClick} style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", flex: 1 }}>
          {user.profile_picture ? (
            <img
              src={getAvatarUrl(user.profile_picture)}
              alt={user.name}
              className="profile-search-avatar"
            />
          ) : (
            <div className="profile-search-avatar-placeholder">👤</div>
          )}
          <div className="profile-search-info">
            <h3 className="profile-search-name">{user.name || user.username}</h3>
            <span className="profile-search-username">@{user.username}</span>
            {user.department && (
              <span className="profile-search-dept">🎓 {user.department}</span>
            )}
          </div>
        </div>

        {!isMe && (
          <button
            className={`btn-primary follow-btn ${isFollowing ? "unfollow" : requestSent ? "requested" : ""}`}
            onClick={handleFollowToggle}
            disabled={loading}
          >
            {loading ? "..." : isFollowing ? "Unfollow" : requestSent ? "Requested" : "Follow"}
          </button>
        )}
      </div>

      {user.bio && <p className="profile-search-bio">{user.bio}</p>}

      {user.skills && (
        <div className="profile-search-skills">
          {user.skills.split(",").map((skill, idx) => (
            <span key={idx} className="skill-tag">
              {skill.trim()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProfileCard;
