import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { liveSearch } from "../services/searchService";
import "../styles/LiveSearch.css";

const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23e4e6eb'/><circle cx='50' cy='35' r='20' fill='%238a8d91'/><path d='M20,80 C20,60 80,60 80,80' fill='%238a8d91'/></svg>";

function LiveSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  // Debounce API calls when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults({ users: [], posts: [] });
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const data = await liveSearch(query);
        setResults(data);
        setShowDropdown(true);
      } catch (err) {
        console.error("Live search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Limit total results in dropdown to max 6
  const limit = 6;
  const displayedUsers = (results.users || []).slice(0, 3);
  const remainingLimit = limit - displayedUsers.length;
  const displayedPosts = (results.posts || []).slice(0, remainingLimit);

  const handleUserClick = (username) => {
    navigate(`/feed?search=${encodeURIComponent(username)}`);
    setQuery("");
    setShowDropdown(false);
  };

  const handlePostClick = (caption) => {
    navigate(`/feed?search=${encodeURIComponent(caption)}`);
    setQuery("");
    setShowDropdown(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (query.trim()) {
        navigate(`/feed?search=${encodeURIComponent(query.trim())}`);
        setShowDropdown(false);
      }
    }
  };

  return (
    <div className="search-container" ref={searchRef}>
      <span className="search-icon">🔍</span>
      <input
        type="text"
        placeholder="Search posts, topics, or users..."
        className="search-bar"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (query.trim()) setShowDropdown(true);
        }}
        onKeyDown={handleKeyDown}
      />
      {query && (
        <button
          className="search-clear-btn"
          onClick={() => {
            setQuery("");
            setResults({ users: [], posts: [] });
            setShowDropdown(false);
          }}
          title="Clear search"
        >
          ✕
        </button>
      )}
      {loading && <span className="search-spinner">⏳</span>}

      {showDropdown && (displayedUsers.length > 0 || displayedPosts.length > 0) && (
        <div className="search-dropdown glass-panel">
          {displayedUsers.length > 0 && (
            <div className="search-dropdown-section">
              <h4>Users</h4>
              <div className="section-divider"></div>
              {displayedUsers.map((user) => (
                <div
                  key={user.id}
                  className="search-result-item user-item"
                  onClick={() => handleUserClick(user.username)}
                >
                  <img
                    src={
                      user.profile_picture
                        ? `http://127.0.0.1:8000${user.profile_picture}`
                        : DEFAULT_AVATAR
                    }
                    alt={user.username}
                    className="result-avatar"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_AVATAR;
                    }}
                  />
                  <div className="result-info">
                    <span className="result-username">@{user.username}</span>
                    {user.name && <span className="result-name">{user.name}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {displayedPosts.length > 0 && (
            <div className="search-dropdown-section">
              <h4>Posts</h4>
              <div className="section-divider"></div>
              {displayedPosts.map((post) => (
                <div
                  key={post.id}
                  className="search-result-item post-item"
                  onClick={() => handlePostClick(post.caption)}
                >
                  <span className="post-icon">📝</span>
                  <div className="result-info">
                    <p className="result-caption">{post.caption}</p>
                    <span className="result-author">by @{post.owner_username}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LiveSearch;
