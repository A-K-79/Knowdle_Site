import { useEffect, useState } from "react";
import { getProfile } from "../services/profileService";
import "../styles/Sidebar.css";
import { useNavigate, useLocation } from "react-router-dom";

function LeftSidebar() {
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const currentType = queryParams.get("type") || "posts";

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getProfile();
                setProfile(data);
            } catch (err) {
                console.log("Failed to fetch sidebar profile:", err);
                setError(true);
            }
        };

        fetchProfile();
    }, []);

    if (error) {
        return (
            <div className="left-sidebar">
                <div className="profile-card glass-panel error-card">
                    <p style={{ color: "var(--neon-rose)" }}>Failed to load profile.</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="left-sidebar">
                <div className="profile-card glass-panel skeleton-loader">
                    <div className="skeleton-avatar"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line short"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="left-sidebar">
            <div
                className="profile-card glass-panel"
                onClick={() => navigate("/profile")}
                title="View Full Profile"
            >
                <div className="profile-image-container">
                    {profile.profile_picture ? (
                        <img
                            src={`http://127.0.0.1:8000${profile.profile_picture}`}
                            alt="Profile"
                            className="profile-image"
                        />
                    ) : (
                        <div className="avatar">
                            👤
                        </div>
                    )}
                </div>

                <h2 className="profile-name">{profile.name || profile.username}</h2>
                <p className="profile-username">@{profile.username}</p>

                {profile.bio && <p className="bio">{profile.bio}</p>}
                
                {profile.department && (
                    <span className="profile-dept-badge">
                        🎓 {profile.department}
                    </span>
                )}

                <hr className="divider" />

                <div className="stats">
                    <div className="stat">
                        <h3>{profile.followers_count ?? 0}</h3>
                        <span>Followers</span>
                    </div>

                    <div className="stat">
                        <h3>{profile.following_count ?? 0}</h3>
                        <span>Following</span>
                    </div>
                </div>

                <div className="edit-profile-text">
                    ✏️ Edit Profile Page
                </div>
            </div>

            {/* Navigation Menu Card */}
            <div className="sidebar-menu-card glass-panel">
                <button
                    className={`menu-item-btn ${location.pathname === "/feed" && currentType !== "vibes" ? "active" : ""}`}
                    onClick={() => navigate("/feed?type=posts")}
                >
                    🏠 <span className="menu-text">Posts</span>
                </button>
                <button
                    className={`menu-item-btn ${location.pathname === "/feed" && currentType === "vibes" ? "active" : ""}`}
                    onClick={() => navigate("/feed?type=vibes")}
                >
                    🎥 <span className="menu-text">Vibes</span>
                </button>
                <button
                    className={`menu-item-btn ${location.pathname === "/teams" || location.pathname.startsWith("/teams/") ? "active" : ""}`}
                    onClick={() => navigate("/teams")}
                >
                    👥 <span className="menu-text">Teams</span>
                </button>
                <button
                    className={`menu-item-btn ${location.pathname === "/events" ? "active" : ""}`}
                    onClick={() => navigate("/events")}
                >
                    📅 <span className="menu-text">Event Hub</span>
                </button>
                <button
                    className="menu-item-btn"
                    onClick={() => {
                        navigate("/feed");
                        setTimeout(() => {
                            const searchBar = document.querySelector(".search-bar");
                            if (searchBar) searchBar.focus();
                        }, 100);
                    }}
                >
                    🔍 <span className="menu-text">Search</span>
                </button>
                <button
                    className={`menu-item-btn ${location.pathname === "/profile" ? "active" : ""}`}
                    onClick={() => navigate("/profile")}
                >
                    👤 <span className="menu-text">Profile</span>
                </button>
            </div>
        </div>
    );
}

export default LeftSidebar;
