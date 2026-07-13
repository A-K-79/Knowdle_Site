import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import LeftSidebar from "../components/LeftSidebar";
import RightSidebar from "../components/RightSidebar";
import FeedContent from "../components/FeedContent";
import "../styles/Feed.css";

function Feed() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("open_ai") === "true") {
      setSidebarOpen(true);
      // Clean query parameter from URL bar
      window.history.replaceState(null, "", "/feed");
    }
  }, [location.search]);

  return (
    <>
      <Navbar onOpenSidebar={() => setSidebarOpen(true)} />

      <div className={`feed-layout ${sidebarOpen ? "shift-left" : ""}`}>
        <LeftSidebar />
        
        <FeedContent />
        
        {/* Toggleable Drawer Right Sidebar */}
        <RightSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Floating Action Button for opening RightSidebar Drawer */}
      <button
        className="ai-sidebar-toggle-fab"
        onClick={() => setSidebarOpen(true)}
        title="Open AI Assistant & Trends"
      >
         <span className="fab-label">🤖</span>
      </button>
    </>
  );
}

export default Feed;