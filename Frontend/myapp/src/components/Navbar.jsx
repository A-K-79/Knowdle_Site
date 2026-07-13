import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { logout } from "../services/authService.jsx";
import { getProfile } from "../services/profileService";
import LiveSearch from "./LiveSearch";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, clearAllNotifications } from "../services/notificationService";
import "./../styles/Navbar.css";

function Navbar({ onOpenSidebar }) {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const currentType = queryParams.get("type") || "posts";
    
    const [isStaff, setIsStaff] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(null);

    // Notifications state
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
    const notifContainerRef = useRef(null);

    useEffect(() => {
        const fetchUserRole = async () => {
            try {
                const profile = await getProfile();
                setIsStaff(profile.is_staff);
                if (profile.username) {
                    localStorage.setItem("username", profile.username);
                }
                if (profile.user_id) {
                    localStorage.setItem("userId", profile.user_id.toString());
                }
                if (profile.profile_picture) {
                    setAvatarUrl(`http://127.0.0.1:8000${profile.profile_picture}`);
                }
            } catch (err) {
                console.log("Failed to fetch profile in navbar:", err);
            }
        };

        if (localStorage.getItem("authToken")) {
            fetchUserRole();
            fetchNotificationsData();
        }
    }, [location.pathname]);

    // Periodically poll unread count
    useEffect(() => {
        let intervalId;
        if (localStorage.getItem("authToken")) {
            intervalId = setInterval(() => {
                fetchUnreadCountOnly();
            }, 8000); // every 8 seconds
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, []);

    // Close notifications dropdown on clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifContainerRef.current && !notifContainerRef.current.contains(event.target)) {
                setShowNotificationsDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchNotificationsData = async () => {
        try {
            const countData = await getUnreadCount();
            setUnreadCount(countData.unread_count);
            
            const listData = await getNotifications();
            setNotifications(listData);
        } catch (err) {
            console.error("Failed to load notifications data:", err);
        }
    };

    const fetchUnreadCountOnly = async () => {
        try {
            const countData = await getUnreadCount();
            setUnreadCount(countData.unread_count);
        } catch (err) {
            console.error("Failed to poll unread count:", err);
        }
    };

    const toggleNotifications = async () => {
        if (!showNotificationsDropdown) {
            await fetchNotificationsData();
        }
        setShowNotificationsDropdown((prev) => !prev);
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAsRead();
            setUnreadCount(0);
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        } catch (err) {
            console.error(err);
        }
    };

    const handleClearAll = async () => {
        try {
            await clearAllNotifications();
            setUnreadCount(0);
            setNotifications([]);
        } catch (err) {
            console.error("Failed to clear all notifications:", err);
        }
    };

    const handleNotificationClick = async (notif) => {
        try {
            if (!notif.is_read) {
                await markAsRead(notif.id);
                setUnreadCount((prev) => Math.max(0, prev - 1));
                setNotifications((prev) =>
                    prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
                );
            }
            setShowNotificationsDropdown(false);

            // Redirect based on type
            if (notif.notification_type === "LIKE" || notif.notification_type === "COMMENT" || notif.notification_type === "FOLLOW_REQUEST") {
                navigate("/profile");
            } else if (notif.notification_type === "FOLLOW_ACCEPT") {
                navigate(`/profile?username=${notif.sender_details?.username || ""}`);
            } else if (notif.notification_type === "TEAM_INVITE" || notif.notification_type === "TEAM_JOIN_REQUEST") {
                navigate("/teams");
            }
        } catch (err) {
            console.error("Failed to handle notification click:", err);
        }
    };

    const formatNotifTime = (dateString) => {
        const diff = new Date() - new Date(dateString);
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return new Date(dateString).toLocaleDateString();
    };

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <nav className="navbar glass-panel">
            <div className="logo" onClick={() => navigate("/feed")} style={{ cursor: "pointer" }}>
                <span>📚</span> <span className="gradient-text">KNOWDLE</span>
            </div>

            <LiveSearch />

            <div className="nav-items">
                <button
                    className={`nav-btn ${location.pathname === "/feed" && currentType !== "vibes" ? "active" : ""}`}
                    onClick={() => navigate("/feed?type=posts")}
                >
                    Posts
                </button>

                <button
                    className={`nav-btn ${location.pathname === "/feed" && currentType === "vibes" ? "active" : ""}`}
                    onClick={() => navigate("/feed?type=vibes")}
                >
                    Vibes
                </button>

                <button
                    className={`nav-btn ${location.pathname === "/teams" || location.pathname.startsWith("/teams/") ? "active" : ""}`}
                    onClick={() => navigate("/teams")}
                >
                    Teams
                </button>

                <button
                    className={`nav-btn ${location.pathname === "/events" ? "active" : ""}`}
                    onClick={() => navigate("/events")}
                >
                    Events
                </button>

                <button
                    className="nav-btn"
                    onClick={() => {
                        if (location.pathname === "/feed") {
                            if (onOpenSidebar) onOpenSidebar();
                        } else {
                            navigate("/feed?open_ai=true");
                        }
                    }}
                    style={{ color: "var(--accent-primary)" }}
                >
                    🤖
                </button>

                <button
                    className={`nav-btn ${location.pathname === "/profile" ? "active" : ""}`}
                    onClick={() => navigate("/profile")}
                >
                    Profile
                </button>

                {/* Notifications Bell */}
                <div className="nav-notifications-container" ref={notifContainerRef}>
                    <button
                        className={`nav-btn nav-bell-btn ${showNotificationsDropdown ? "active" : ""}`}
                        onClick={toggleNotifications}
                        title="Notifications"
                    >
                        🔔
                        {unreadCount > 0 && (
                            <span className="nav-bell-badge">{unreadCount}</span>
                        )}
                    </button>

                    {showNotificationsDropdown && (
                        <div className="notifications-dropdown glass-panel">
                            <div className="notif-dropdown-header">
                                <h3>Notifications</h3>
                                <div style={{ display: "flex", gap: "6px" }}>
                                    {unreadCount > 0 && (
                                        <button className="btn-clear-invite-selection" onClick={handleMarkAllRead} style={{ fontSize: '11px', padding: '2px 6px', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                                            Mark read
                                        </button>
                                    )}
                                    {notifications.length > 0 && (
                                        <button className="btn-clear-invite-selection" onClick={handleClearAll} style={{ fontSize: '11px', padding: '2px 6px', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--neon-rose)' }}>
                                            Clear all
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="notif-dropdown-body">
                                {notifications.length === 0 ? (
                                    <div className="notif-empty-state">
                                        <span>📭</span>
                                        <p>No notifications yet</p>
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            className={`notif-dropdown-item ${notif.is_read ? "read" : "unread"}`}
                                            onClick={() => handleNotificationClick(notif)}
                                        >
                                            <img
                                                src={
                                                    notif.sender_details?.profile_picture
                                                        ? `http://127.0.0.1:8000${notif.sender_details.profile_picture}`
                                                        : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23e4e6eb'/><circle cx='50' cy='35' r='20' fill='%238a8d91'/><path d='M20,80 C20,60 80,60 80,80' fill='%238a8d91'/></svg>"
                                                }
                                                alt="Sender"
                                                className="notif-item-avatar"
                                            />
                                            <div className="notif-item-content">
                                                <p className="notif-item-text">{notif.text}</p>
                                                <span className="notif-item-time">
                                                    {formatNotifTime(notif.created_at)}
                                                </span>
                                            </div>
                                            {!notif.is_read && <span className="notif-unread-dot"></span>}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {isStaff && (
                    <button
                        className={`nav-btn admin-badge ${location.pathname === "/admin" ? "active" : ""}`}
                        onClick={() => navigate("/admin")}
                    >
                        Admin Panel
                    </button>
                )}

                <div className="nav-profile-section">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="nav-avatar"
                            onClick={() => navigate("/profile")}
                        />
                    ) : (
                        <div
                            className="nav-avatar-placeholder"
                            onClick={() => navigate("/profile")}
                        >
                            👤
                        </div>
                    )}
                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;