import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getFeed, createPost } from "../services/postService.jsx";
import { searchPosts, searchUsers, searchTopics } from "../services/searchService.js";
import { getProfile } from "../services/profileService.jsx";
import { getTeams } from "../services/teamService";
import PostCard from "./PostCard";
import ProfileCard from "./ProfileCard";

function FeedContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const searchParam = queryParams.get("search") || "";
  const type = queryParams.get("type") || "posts";

  useEffect(() => {
    if (type === "vibes") {
      setMediaType("VIDEO");
    } else {
      setMediaType("TEXT");
    }
    setMediaFile(null);
    setCaption("");
    setCreateError("");
  }, [type]);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  // Post Creator State
  const [caption, setCaption] = useState("");
  const [mediaType, setMediaType] = useState("TEXT");
  const [mediaFile, setMediaFile] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Teams & Visibility State
  const [joinedTeams, setJoinedTeams] = useState([]);
  const [visibilityType, setVisibilityType] = useState("PUBLIC"); // 'PUBLIC' | 'FRIENDS' | 'STUDY' | 'PROFESSIONAL'
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [feedCategory, setFeedCategory] = useState("all"); // 'all' | 'friends' | 'study' | 'professional'

  // Search Results State
  const [searchTab, setSearchTab] = useState("posts"); // 'posts' | 'users' | 'topics'
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchJoinedTeams();
  }, []);

  useEffect(() => {
    if (searchParam) {
      handleSearch(searchParam, searchTab);
    } else {
      fetchFeed();
    }
  }, [searchParam, searchTab, feedCategory]);

  const fetchProfile = async () => {
    try {
      const data = await getProfile();
      setProfile(data);
    } catch (err) {
      console.error("Failed to load profile in feed content:", err);
    }
  };

  const fetchJoinedTeams = async () => {
    try {
      const teamsData = await getTeams();
      setJoinedTeams(teamsData);
    } catch (err) {
      console.error("Failed to load teams in feed content:", err);
    }
  };

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const data = await getFeed({ category: feedCategory });
      setPosts(data);
      setSearchResults([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query, tab) => {
    setSearchLoading(true);
    try {
      let results = [];
      if (tab === "posts") {
        results = await searchPosts(query);
      } else if (tab === "users") {
        results = await searchUsers(query);
      } else if (tab === "topics") {
        results = await searchTopics(query);
      }
      setSearchResults(results);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setSearchLoading(false);
    }
  };

const getVideoDuration = (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      reject("Error loading video metadata");
    };
    video.src = URL.createObjectURL(file);
  });
};

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!caption.trim() && !mediaFile) {
      setCreateError("A post must contain either a caption or a media file.");
      return;
    }
    if (type === "vibes" && !mediaFile) {
      setCreateError("Please select a video file for your vibe.");
      return;
    }
    if (type === "posts" && mediaType === "IMAGE" && !mediaFile) {
      setCreateError("Please select an image file for your post.");
      return;
    }

    setCreateLoading(true);
    setCreateError("");

    if (mediaFile) {
      // 1. Check size limit of 3 GB
      const maxSize = 3 * 1024 * 1024 * 1024;
      if (mediaFile.size > maxSize) {
        setCreateError("File is too large. Maximum upload size is 3 GB.");
        setCreateLoading(false);
        return;
      }

      // 2. Check video duration limit of 30 minutes
      if (mediaType === "VIDEO") {
        try {
          const duration = await getVideoDuration(mediaFile);
          if (duration > 30 * 60) {
            setCreateError("Video is too long. Maximum video duration is 30 minutes.");
            setCreateLoading(false);
            return;
          }
        } catch (err) {
          console.error(err);
          setCreateError("Could not retrieve video metadata. Please ensure it is a valid video file.");
          setCreateLoading(false);
          return;
        }
      }
    }

    if (visibilityType !== "PUBLIC" && !selectedTeamId) {
      setCreateError("Please select a specific team for this visibility setting.");
      setCreateLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("caption", caption);
    formData.append("media_type", mediaType);
    if (mediaFile) {
      formData.append("media_file", mediaFile);
    }
    if (visibilityType !== "PUBLIC" && selectedTeamId) {
      formData.append("team", selectedTeamId);
    }

    try {
      await createPost(formData);
      setCaption("");
      setMediaFile(null);
      setMediaType("TEXT");
      setVisibilityType("PUBLIC");
      setSelectedTeamId("");
      // Reset file input element if possible
      const fileInput = document.getElementById("post-file-input");
      if (fileInput) fileInput.value = "";
      fetchFeed();
    } catch (err) {
      console.error(err);
      setCreateError(err.error || "Failed to publish post.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handlePostDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setSearchResults((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleFollowToggleInList = (username, isFollowing) => {
    if (!profile) return;
    const updatedList = isFollowing
      ? [...profile.following_list, username]
      : profile.following_list.filter((u) => u !== username);
    setProfile({ ...profile, following_list: updatedList });
  };

  const clearSearch = () => {
    navigate("/feed");
  };

  const displayedPosts = posts.filter((post) => {
    if (type === "vibes") {
      return post.media_type === "VIDEO";
    } else {
      return post.media_type !== "VIDEO";
    }
  });

  const displayedSearchResults = searchResults.filter((item) => {
    if (searchTab === "posts") {
      if (type === "vibes") {
        return item.media_type === "VIDEO";
      } else {
        return item.media_type !== "VIDEO";
      }
    }
    return true;
  });

  return (
    <div className="feed-content-area">
      {/* 1. Post Creator box */}
      {!searchParam && (
        <form onSubmit={handleCreatePost} className="post-creator-box glass-panel">
          <div className="creator-header">
            <h3>{type === "vibes" ? "🎥 Share a new Vibe" : "✍️ Share a new Post"}</h3>
          </div>

          <textarea
            placeholder={type === "vibes" ? "Write a caption for your new vibe (video)..." : "What study notes, question, or updates do you have today?"}
            className="creator-textarea"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            disabled={createLoading}
          />

          {createError && <p className="creator-error-msg">{createError}</p>}

          <div className="creator-actions">
            <div className="creator-options">
              {type !== "vibes" && (
                <select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value)}
                  className="media-type-select"
                  disabled={createLoading}
                >
                  <option value="TEXT">Text Only</option>
                  <option value="IMAGE">Post (Image)</option>
                </select>
              )}

              <select
                value={visibilityType}
                onChange={(e) => {
                  setVisibilityType(e.target.value);
                  setSelectedTeamId("");
                }}
                className="visibility-type-select"
                disabled={createLoading}
              >
                <option value="PUBLIC">🌍 Public</option>
                <option value="FRIENDS">👥 Friends Team</option>
                <option value="STUDY">📚 Study Team</option>
                <option value="PROFESSIONAL">💼 Professional Team</option>
              </select>

              {visibilityType !== "PUBLIC" && (
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="team-select-dropdown"
                  disabled={createLoading}
                  required
                >
                  <option value="">-- Choose Team --</option>
                  {joinedTeams
                    .filter((t) => t.team_type === visibilityType)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              )}

              {type === "vibes" ? (
                <input
                  type="file"
                  id="post-file-input"
                  className="file-input-btn"
                  onChange={(e) => setMediaFile(e.target.files[0])}
                  accept="video/*"
                  disabled={createLoading}
                  required
                />
              ) : (
                mediaType === "IMAGE" && (
                  <input
                    type="file"
                    id="post-file-input"
                    className="file-input-btn"
                    onChange={(e) => setMediaFile(e.target.files[0])}
                    accept="image/*"
                    disabled={createLoading}
                    required
                  />
                )
              )}
            </div>

            <button type="submit" className="btn-primary publish-btn" disabled={createLoading}>
              {createLoading ? "Publishing..." : type === "vibes" ? "Share Vibe 🚀" : "Publish Post 🚀"}
            </button>
          </div>
        </form>
      )}

      {/* Feed Category Selector */}
      {!searchParam && (
        <div className="feed-category-tabs glass-panel">
          <button
            className={`category-tab-btn ${feedCategory === "all" ? "active" : ""}`}
            onClick={() => setFeedCategory("all")}
          >
            🌍 All {type === "vibes" ? "Vibes" : "Posts"}
          </button>
          <button
            className={`category-tab-btn ${feedCategory === "friends" ? "active" : ""}`}
            onClick={() => setFeedCategory("friends")}
          >
            👥 Friends
          </button>
          <button
            className={`category-tab-btn ${feedCategory === "study" ? "active" : ""}`}
            onClick={() => setFeedCategory("study")}
          >
            📚 Study
          </button>
          <button
            className={`category-tab-btn ${feedCategory === "professional" ? "active" : ""}`}
            onClick={() => setFeedCategory("professional")}
          >
            💼 Professional
          </button>
        </div>
      )}

      {/* 2. Search Navigation Header */}
      {searchParam && (
        <div className="search-header-container glass-panel">
          <button className="back-feed-btn" onClick={clearSearch}>
            ← Back to {type === "vibes" ? "Vibes" : "Posts"}
          </button>
          <div className="search-meta-info">
            <h2>
              Search Results for <span className="gradient-text">"{searchParam}"</span>
            </h2>
          </div>

          <div className="search-tabs">
            <button
              className={`search-tab-btn ${searchTab === "posts" ? "active" : ""}`}
              onClick={() => setSearchTab("posts")}
            >
              Posts
            </button>
            <button
              className={`search-tab-btn ${searchTab === "users" ? "active" : ""}`}
              onClick={() => setSearchTab("users")}
            >
              Users
            </button>
            <button
              className={`search-tab-btn ${searchTab === "topics" ? "active" : ""}`}
              onClick={() => setSearchTab("topics")}
            >
              Topics (Hashtags)
            </button>
          </div>
        </div>
      )}

      {/* 3. Feed List / Search List */}
      <div className="posts-feed-list">
        {searchParam ? (
          (searchLoading && displayedSearchResults.length === 0) ? (
            <div className="feed-spinner-container">
              <div className="spinner"></div>
              <p>Searching network database...</p>
            </div>
          ) : displayedSearchResults.length === 0 ? (
            <div className="empty-feed-card glass-panel">
              <p>No results found for "{searchParam}" under {searchTab}.</p>
            </div>
          ) : (
            <>
              {searchLoading && (
                <div className="search-inline-loader">
                  <span className="mini-spinner"></span> Updating results...
                </div>
              )}
              {searchTab === "users" ? (
                displayedSearchResults.map((user) => (
                  <ProfileCard
                    key={user.id}
                    user={user}
                    followingList={profile ? profile.following_list : []}
                    onFollowToggle={handleFollowToggleInList}
                  />
                ))
              ) : (
                displayedSearchResults.map((post) => (
                  <PostCard key={post.id} post={post} onDelete={handlePostDelete} />
                ))
              )}
            </>
          )
        ) : loading ? (
          <div className="feed-spinner-container">
            <div className="spinner"></div>
            <p>Loading your feed posts...</p>
          </div>
        ) : displayedPosts.length === 0 ? (
          <div className="empty-feed-card glass-panel">
            <p>No {type === "vibes" ? "vibes" : "posts"} on the feed yet. Share the first one!</p>
          </div>
        ) : (
          displayedPosts.map((post) => (
            <PostCard key={post.id} post={post} onDelete={handlePostDelete} />
          ))
        )}
      </div>
    </div>
  );
}

export default FeedContent;