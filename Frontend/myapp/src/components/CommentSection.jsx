import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getComments, addComment } from "../services/postService.jsx";

function CommentSection({ postId }) {
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const data = await getComments(postId);
      setComments(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch comments.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await addComment(postId, newComment.trim());
      setNewComment("");
      fetchComments(); // reload comments
    } catch (err) {
      console.error(err);
      setError("Failed to post comment.");
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="comment-section glass-panel">
      <h4>Comments ({comments.length})</h4>

      {error && <p className="comment-error">{error}</p>}

      <form onSubmit={handleSubmit} className="comment-form">
        <input
          type="text"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="comment-input"
        />
        <button type="submit" className="btn-primary comment-btn" disabled={!newComment.trim()}>
          Post
        </button>
      </form>

      {loading && comments.length === 0 ? (
        <p className="comment-loading">Loading comments...</p>
      ) : (
        <div className="comments-list">
          {comments.length === 0 ? (
            <p className="no-comments">No comments yet. Start the conversation!</p>
          ) : (
            comments.map((comment, index) => (
              <div key={index} className="comment-item">
                <div
                  className="comment-meta"
                  onClick={() => navigate(`/profile?username=${comment.username}`)}
                  style={{ cursor: "pointer" }}
                >
                  <span className="comment-author" style={{ fontWeight: 600 }}>{comment.name || comment.username}</span>
                  <span className="comment-author-username" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '4px' }}>@{comment.username}</span>
                  <span className="comment-date">{formatDate(comment.created_at)}</span>
                </div>
                <p className="comment-text">{comment.text}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default CommentSection;
