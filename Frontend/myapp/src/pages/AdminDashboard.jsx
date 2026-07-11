import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import { getDashboardStats, listUsers, deactivateUser, deleteUser } from "../services/adminService";
import { getFeed } from "../services/postService";
import "../styles/Admin.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  
  const [authorized, setAuthorized] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("users"); // 'users' | 'posts'
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      // Parallel fetch admin dashboard, user management, and posts
      const [statsData, usersList, postsList] = await Promise.all([
        getDashboardStats(),
        listUsers(),
        getFeed(), // feed serves as post list for moderation
      ]);
      
      setStats(statsData);
      setUsers(usersList);
      setPosts(postsList);
      setAuthorized(true);
    } catch (err) {
      console.error(err);
      if (err.status === 403 || err.status === 401 || (err.detail && err.detail.includes("permission"))) {
        setAuthorized(false);
      } else {
        setErrorMsg("Failed to load administration workspace.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (userId, username) => {
    if (!window.confirm(`Deactivate user "${username}"? They won't be able to log in.`)) return;
    try {
      await deactivateUser(userId);
      alert(`User ${username} deactivated.`);
      // Refresh user list
      const updatedList = await listUsers();
      setUsers(updatedList);
    } catch (err) {
      console.error(err);
      alert("Failed to deactivate user.");
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Permanently delete user "${username}"? This action CANNOT be undone.`)) return;
    try {
      await deleteUser(userId);
      alert(`User ${username} deleted.`);
      // Refresh user list and stats
      const [statsData, usersList] = await Promise.all([getDashboardStats(), listUsers()]);
      setStats(statsData);
      setUsers(usersList);
    } catch (err) {
      console.error(err);
      alert("Failed to delete user.");
    }
  };

  const handlePostDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    // Refresh stats after deletion
    getDashboardStats().then((data) => setStats(data)).catch((e) => console.log(e));
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="admin-container loading">
          <div className="spinner"></div>
          <p>Verifying administrative credentials...</p>
        </div>
      </>
    );
  }

  if (!authorized) {
    return (
      <>
        <Navbar />
        <div className="admin-container unauthorized">
          <div className="glass-panel unauthorized-card">
            <h2>⚠️ Access Denied</h2>
            <p>You do not have staff or administrator privileges to view this page.</p>
            <button className="btn-primary" onClick={() => navigate("/feed")}>
              Return to Feed
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="admin-container">
        <header className="admin-header">
          <h2>🛡️ Moderator Workspace</h2>
          <p>System oversight, account locks, and content moderation.</p>
        </header>

        {errorMsg && <p className="admin-error-global">{errorMsg}</p>}

        {/* 1. Statistics Cards */}
        {stats && (
          <div className="admin-stats-grid">
            <div className="admin-stat-card glass-panel">
              <span className="card-icon">👥</span>
              <div className="card-info">
                <h3>{stats.total_users}</h3>
                <p>Total Registered Students</p>
              </div>
            </div>

            <div className="admin-stat-card glass-panel">
              <span className="card-icon">📝</span>
              <div className="card-info">
                <h3>{stats.total_posts}</h3>
                <p>Total Published Posts</p>
              </div>
            </div>

            <div className="admin-stat-card glass-panel">
              <span className="card-icon">💬</span>
              <div className="card-info">
                <h3>{stats.total_comments}</h3>
                <p>Comment Engagements</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. Sub Tabs Toggles */}
        <div className="admin-moderation-panel glass-panel">
          <div className="admin-panel-tabs">
            <button
              className={`panel-tab-btn ${activeSubTab === "users" ? "active" : ""}`}
              onClick={() => setActiveSubTab("users")}
            >
              Manage Student Accounts
            </button>
            <button
              className={`panel-tab-btn ${activeSubTab === "posts" ? "active" : ""}`}
              onClick={() => setActiveSubTab("posts")}
            >
              Post Content Moderation
            </button>
          </div>

          {/* 3. Panel Content */}
          <div className="admin-panel-content">
            {activeSubTab === "users" ? (
              /* USERS TABLE */
              <div className="users-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Account Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td className="username-cell">@{u.username}</td>
                        <td>{u.email || "No email listed"}</td>
                        <td>
                          {u.is_staff ? (
                            <span className="role-badge staff">Staff Admin</span>
                          ) : (
                            <span className="role-badge student">Student</span>
                          )}
                        </td>
                        <td>
                          {u.is_active ? (
                            <span className="status-badge active">Active</span>
                          ) : (
                            <span className="status-badge inactive">Deactivated</span>
                          )}
                        </td>
                        <td className="actions-cell">
                          {u.is_active ? (
                            <button
                              className="btn-danger-table"
                              onClick={() => handleDeactivate(u.id, u.username)}
                              disabled={u.is_staff}
                            >
                              Deactivate 🔒
                            </button>
                          ) : (
                            <span className="status-text-deactivated">Locked</span>
                          )}
                          <button
                            className="btn-danger-table delete"
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            disabled={u.is_staff}
                          >
                            Delete 🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* POSTS LIST MODERATION */
              <div className="posts-moderation-list">
                {posts.length === 0 ? (
                  <p className="no-posts-mod">No active posts are reported or available.</p>
                ) : (
                  posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onDelete={handlePostDelete}
                      isAdminView={true}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminDashboard;
