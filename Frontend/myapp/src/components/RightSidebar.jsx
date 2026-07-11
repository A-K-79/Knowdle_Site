import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { summarizeNotes } from "../services/aiService.jsx";
import "../styles/Sidebar.css";

function RightSidebar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const [notes, setNotes] = useState("");
    const [summary, setSummary] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSummarize = async () => {
        if (!notes.trim()) return;
        setLoading(true);
        setError("");
        setSummary("");
        try {
            const data = await summarizeNotes(notes);
            // Simulate a typewriter typing output
            const words = (data.summary || "").split(" ");
            let index = 0;
            let tempSummary = "";

            const timer = setInterval(() => {
                if (index < words.length) {
                    tempSummary += (index === 0 ? "" : " ") + words[index];
                    setSummary(tempSummary);
                    index++;
                } else {
                    clearInterval(timer);
                }
            }, 30);
        } catch (err) {
            setError(err.error || "Failed to generate AI summary.");
        } finally {
            setLoading(false);
        }
    };

    const handleHashtagClick = (tag) => {
        navigate(`/feed?search=${encodeURIComponent(tag)}`);
        if (onClose) onClose(); // Auto-close drawer on click
    };

    return (
        <div className={`right-sidebar glass-panel ${isOpen ? "open" : ""}`}>
            <div className="drawer-header">
                <button className="sidebar-close-btn" onClick={onClose} title="Close Panel">
                    ✕
                </button>
            </div>

            <div className="ai-card glass-panel">
                <div className="ai-card-header">
                    <h3>🤖 AI Study Assistant</h3>
                    <span className="ai-badge-new">Gemini 2.5</span>
                </div>
                <p className="ai-card-desc">Paste your study notes below to get a bulleted summary instantly.</p>
                
                <textarea
                    className="ai-textarea"
                    placeholder="Enter study notes here..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    disabled={loading}
                />

                <button
                    className="btn-primary ai-btn"
                    onClick={handleSummarize}
                    disabled={loading || !notes.trim()}
                >
                    {loading ? (
                        <span className="spinner-container">
                            <span className="mini-spinner"></span> Summarizing...
                        </span>
                    ) : (
                        "Summarize Notes ✨"
                    )}
                </button>

                {error && <p className="ai-error">{error}</p>}

                {summary && (
                    <div className="ai-output glass-panel">
                        <h4>Summary:</h4>
                        <div className="ai-output-text">
                            {summary.split("\n").map((line, i) => (
                                <p key={i} className="summary-line">{line}</p>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="trend-card glass-panel">
                <h3>🔥 Trending Topics</h3>
                <div className="trend-list">
                    {[
                        { tag: "Python", count: "12.4k posts" },
                        { tag: "Java", count: "8.1k posts" },
                        { tag: "AI", count: "24.6k posts" },
                        { tag: "DSA", count: "15.9k posts" },
                        { tag: "React", count: "9.3k posts" },
                    ].map((item, idx) => (
                        <div
                            key={idx}
                            className="trend-item"
                            onClick={() => handleHashtagClick(item.tag)}
                        >
                            <span className="trend-tag">#{item.tag}</span>
                            <span className="trend-count">{item.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default RightSidebar;