import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../services/authService.jsx";
import "../styles/Login.css";

function Login() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Login State
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  
  // Register State
  const [regName, setRegName] = useState("");
  const [regUser, setRegUser] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regConfirmPass, setRegConfirmPass] = useState("");

  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginUser.trim() || !loginPass.trim()) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setMessage("");
    try {
      await login(loginUser, loginPass);
      setMessage("Login successful!");
      setTimeout(() => {
        navigate("/feed");
      }, 800);
    } catch (err) {
      setErrorMsg(err.error || "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regName.trim() || !regUser.trim() || !regEmail.trim() || !regPass.trim()) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    if (regPass !== regConfirmPass) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setMessage("");
    try {
      await register(regUser, regEmail, regPass, regName.trim());
      setMessage("Registration successful! You can now log in.");
      setIsRegistering(false);
      // Clean up fields
      setLoginUser(regUser);
      setRegName("");
      setRegUser("");
      setRegEmail("");
      setRegPass("");
      setRegConfirmPass("");
    } catch (err) {
      setErrorMsg(err.error || "Registration failed. Try a different username.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* Decorative floating blurred blobs */}
      <div className="decor-blob blob1"></div>
      <div className="decor-blob blob2"></div>

      <div className="login-card glass-panel">
        <div className="login-header">
          <h2 className="login-app-title">📚 StudyPulse</h2>
          <p className="login-app-subtitle">
            {isRegistering
              ? "Join the AI social learning community"
              : "Access your student workspace"}
          </p>
        </div>

        <div className="tabs-container">
          <button
            className={`tab-toggle ${!isRegistering ? "active" : ""}`}
            onClick={() => {
              setIsRegistering(false);
              setErrorMsg("");
              setMessage("");
            }}
          >
            Sign In
          </button>
          <button
            className={`tab-toggle ${isRegistering ? "active" : ""}`}
            onClick={() => {
              setIsRegistering(true);
              setErrorMsg("");
              setMessage("");
            }}
          >
            Register
          </button>
        </div>

        {errorMsg && <div className="auth-alert error">{errorMsg}</div>}
        {message && <div className="auth-alert success">{message}</div>}

        {!isRegistering ? (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Enter username"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit} className="login-form">
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter full name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Create username"
                value={regUser}
                onChange={(e) => setRegUser(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="student@university.edu"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Create password"
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="input-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Re-enter password"
                value={regConfirmPass}
                onChange={(e) => setRegConfirmPass(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
              {loading ? "Registering account..." : "Register"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;
