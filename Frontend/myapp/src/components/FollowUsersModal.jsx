import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFollowersList, getFollowingList } from "../services/followService";

function FollowUsersModal({ isOpen, onClose, title, username }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && username) {
      fetchUsers();
    }
  }, [isOpen, username, title]);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      let data = [];
      if (title === "Followers") {
        data = await getFollowersList(username);
      } else {
        data = await getFollowingList(username);
      }
      setUsers(data || []);
    } catch (err) {
      console.error(err);
      setError(`Failed to load ${title.toLowerCase()} list.`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleUserClick = (targetUsername) => {
    navigate(`/profile?username=${targetUsername}`);
    onClose();
  };

  return (
    <div className="follow-modal-overlay" onClick={onClose}>
      <div className="follow-modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="follow-modal-header">
          <h2>{title}</h2>
          <button className="follow-modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="follow-modal-body">
          {loading ? (
            <div className="follow-modal-spinner">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          ) : error ? (
            <p className="follow-modal-error">{error}</p>
          ) : users.length === 0 ? (
            <div className="follow-modal-empty">
              <span>👥</span>
              <p>No users found.</p>
            </div>
          ) : (
            <div className="follow-users-list">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="follow-user-item"
                  onClick={() => handleUserClick(user.username)}
                >
                  <img
                    src={
                      user.profile_picture
                        ? `http://127.0.0.1:8000${user.profile_picture}`
                        : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23e4e6eb'/><circle cx='50' cy='35' r='20' fill='%238a8d91'/><path d='M20,80 C20,60 80,60 80,80' fill='%238a8d91'/></svg>"
                    }
                    alt={user.username}
                    className="follow-user-avatar"
                  />
                  <div className="follow-user-info">
                    <span className="follow-user-username">@{user.username}</span>
                    {user.name && <span className="follow-user-name">{user.name}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FollowUsersModal;
