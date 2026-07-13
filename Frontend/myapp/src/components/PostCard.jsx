import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toggleLike, toggleSave, deletePost, deletePostAsAdmin } from "../services/postService.jsx";
import CommentSection from "./CommentSection";

function PostCard({ post, onDelete, onSaveToggle, isAdminView = false }) {
  const navigate = useNavigate();
  const currentUsername = localStorage.getItem("username");
  const [liked, setLiked] = useState(post.liked_by_user);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [saved, setSaved] = useState(post.saved_by_user);
  const [showComments, setShowComments] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Sync state if post prop changes
  useEffect(() => {
    setLiked(post.liked_by_user);
    setLikesCount(post.likes_count || 0);
    setSaved(post.saved_by_user);
  }, [post]);

  const handleLike = async () => {
    try {
      const res = await toggleLike(post.id);
      if (res.message === "Liked") {
        setLiked(true);
        setLikesCount((prev) => prev + 1);
      } else {
        setLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Like toggle failed:", err);
    }
  };

  const handleSave = async () => {
    try {
      await toggleSave(post.id);
      setSaved(!saved);
      if (onSaveToggle) {
        onSaveToggle(post.id, !saved);
      }
    } catch (err) {
      console.error("Save toggle failed:", err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    setDeleting(true);
    try {
      if (isAdminView) {
        await deletePostAsAdmin(post.id);
      } else {
        await deletePost(post.id);
      }
      if (onDelete) onDelete(post.id);
    } catch (err) {
      console.error("Delete failed:", err);
      alert(err.error || "Failed to delete post.");
    } finally {
      setDeleting(false);
    }
  };

  const getMediaUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `http://127.0.0.1:8000${path}`;
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderTextWithLinks = (text) => {
    if (!text) return "";
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={index} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: 'var(--accent-primary)', textDecoration: 'underline', wordBreak: 'break-all' }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const currentUserId = localStorage.getItem("userId");

  const isOwner = 
    (post.owner_username && currentUsername && post.owner_username.toLowerCase() === currentUsername.toLowerCase()) ||
    (post.owner && currentUserId && post.owner.toString() === currentUserId.toString());

  const isTeamOwner = post.team_owner_username && currentUsername && post.team_owner_username.toLowerCase() === currentUsername.toLowerCase();
  const canDelete = isOwner || isTeamOwner || isAdminView;

  const handleProfileClick = () => {
    navigate(`/profile?username=${post.owner_username}`);
  };

  return (
    <div className="post-card glass-panel" style={{ opacity: deleting ? 0.5 : 1 }}>
      <div className="post-header">
        <div className="post-author-info" onClick={handleProfileClick} style={{ cursor: "pointer" }}>
          {post.owner_profile_picture ? (
            <img
              src={getMediaUrl(post.owner_profile_picture)}
              alt="Owner Avatar"
              className="post-avatar"
            />
          ) : (
            <div className="post-avatar-placeholder">👤</div>
          )}
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" }}>
              <h4 className="post-author-name" style={{ margin: 0 }}>{post.owner_name || post.owner_username || `User ${post.owner}`}</h4>
              <span className="post-author-username" style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>@{post.owner_username}</span>
              {post.media_type === "IMAGE" ? (
                <span className="post-type-badge post-type-image">🖼️ Post</span>
              ) : post.media_type === "VIDEO" ? (
                <span className="post-type-badge post-type-video">🎥 Vibe</span>
              ) : (
                <span className="post-type-badge post-type-text">📝 Text</span>
              )}
              {post.team_name && (
                <span className={`post-team-badge ${post.team_type?.toLowerCase()}`} title={`Shared in ${post.team_name}`}>
                  👥 {post.team_name}
                </span>
              )}
              {post.is_followers_only && (
                <span className="post-type-badge post-type-private" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.15)' }} title="Private Post">
                  🔒 Private
                </span>
              )}
            </div>
            <span className="post-date">{formatDate(post.created_at)}</span>
          </div>
        </div>

        {canDelete && (
          <button className="post-delete-btn" onClick={handleDelete} disabled={deleting} title="Delete Post">
            🗑️
          </button>
        )}
      </div>

      <div className="post-body">
        {post.caption && <p className="post-caption" style={{ whiteSpace: 'pre-wrap' }}>{renderTextWithLinks(post.caption)}</p>}

        {post.media_file && post.media_type === "IMAGE" && (
          <div className="post-media-container">
            <img src={getMediaUrl(post.media_file)} alt="Post attachment" className="post-media-image" />
          </div>
        )}

        {post.media_file && post.media_type === "VIDEO" && (
          <div className="post-media-container">
            <video src={getMediaUrl(post.media_file)} controls className="post-media-video" />
          </div>
        )}
      </div>

      <div className="post-actions">
        <button className={`action-btn like-btn ${liked ? "active" : ""}`} onClick={handleLike}>
          <span className="action-icon">{liked ? "❤️" : "🤍"}</span>
          <span className="action-count">{likesCount}</span>
        </button>

        <button className="action-btn comment-btn" onClick={() => setShowComments(!showComments)}>
          <span className="action-icon">💬</span>
          <span className="action-count">{post.comments_count || 0}</span>
        </button>

        {!isAdminView && (
          <button className={`action-btn save-btn ${saved ? "active" : ""}`} onClick={handleSave}>
            <span className="action-icon">{saved ? "🔖" : "📁"}</span>
            <span>{saved ? "Saved" : "Save"}</span>
          </button>
        )}
      </div>

      {showComments && <CommentSection postId={post.id} />}
    </div>
  );
}

export default PostCard;
