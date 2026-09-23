import { useContext, useEffect, useState } from "react";
import { useNavigate, NavLink, Link } from "react-router-dom";
import { useAuth, AuthContext } from "../context/AuthContext";
import { PORT } from "../config";
import "../App.css";

function Profile() {
  const { isAuthenticated } = useAuth();
  const { token, user, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [picPreview, setPicPreview] = useState("/default-pp.png");
  const [isBroken, setIsBroken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    displayName: "",
    profilePicUrl: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Auto-clear success banner after 3 s
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(t);
  }, [success]);

  // Fetch profile
  useEffect(() => {
    if (!token) return;

    async function fetchProfile() {
      try {
        const res = await fetch(`http://localhost:${PORT}/api/auth/profile`, {
          headers: { Authorization: token },
        });
        const data = await res.json();
        if (res.ok) {
          setProfile(data);
          const savedProfilePic = data.profilePicUrl || "";
          setFormData((prev) => ({
            ...prev,
            displayName: data.displayName || data.username || "",
            profilePicUrl: savedProfilePic,
          }));
          setPicPreview(savedProfilePic || "/default-pp.png");
          updateUser({
            displayName: data.displayName,
            profilePicURL: data.profilePicURL,
          });
          setIsBroken(false);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [token]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Preview the profile pic as the user types in URL
    if (name === "profilePicUrl") {
      setPicPreview(value.trim() || "/default-pp.png");
      setIsBroken(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  // Submit save changes
  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const changePassword = formData.currentPassword.trim() !== "";

    // Validate password section, only when they're filled in
    if (changePassword) {
      if (!formData.newPassword) {
        setError("Please enter a new password.");
        return;
      }
      if (formData.newPassword.length < 6) {
        setError("New password must be at least 6 characters.");
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError("New passwords do not match.");
        return;
      }
    }

    setSaving(true);
    const errors = [];

    // Save display name & profile pic URL
    try {
      const res = await fetch(`http://localhost:${PORT}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          displayName: formData.displayName.trim(),
          profilePicUrl: formData.profilePicUrl.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile((prev) => ({
          ...prev,
          displayName: data.displayName,
          profilePicUrl: data.profilePicUrl,
        }));
        setPicPreview(data.profilePicUrl || "/default-pp.png");
        updateUser({
          displayName: data.displayName,
          profilePicUrl: data.profilePicUrl,
        });
        setIsBroken(false);
      } else {
        errors.push(data.error || "Failed to update profile.");
      }
    } catch {
      errors.push("Could not connect to server.");
    }

    // Change password
    if (changePassword) {
      try {
        const res = await fetch(
          `http://localhost:${PORT}/api/auth/change-password`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
            body: JSON.stringify({
              currentPassword: formData.currentPassword,
              newPassword: formData.newPassword,
            }),
          },
        );
        const data = await res.json();
        if (res.ok) {
          // Clear fields after change
          setFormData((prev) => ({
            ...prev,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          }));
        } else {
          errors.push(data.error || "Failed to change password.");
        }
      } catch {
        errors.push("Could not connect to server (password).");
      }
    }

    setSaving(false);

    if (errors.length > 0) {
      setError(errors.join(" "));
    } else {
      setSuccess("Profile updated successfully!");
    }
  }

  return (
    <div className="home page-container">
      {/* Nav-bar */}
      <nav className="home-nav">
        <Link to="/home" className="home-nav-logo">
          <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 9H4M7 3V5M17 3V5M16 15.5C16 16.3284 15.3284 17 14.5 17C13.6716 17 13 16.3284 13 15.5C13 14.6716 13.6716 14 14.5 14C15.3284 14 16 14.6716 16 15.5ZM6 21H18C19.1046 21 20 20.1046 20 19V7C20 5.89543 19.1046 5 18 5H6C4.89543 5 4 5.89543 4 7V19C4 20.1046 4.89543 21 6 21Z"
              stroke="#ffffff"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <div>VendorHub</div>
        </Link>
        <div className="home-nav-links">
          <NavLink
            to="/explore"
            className={({ isActive }) =>
              isActive ? "nav-btn active-nav-btn" : "nav-btn"
            }
          >
            Explore
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink
                to="/favorites"
                className={({ isActive }) =>
                  isActive ? "nav-btn active-nav-btn" : "nav-btn"
                }
              >
                Favorites
              </NavLink>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  isActive ? "nav-btn active-nav-btn" : "nav-btn"
                }
              >
                My Dashboard
              </NavLink>

              {/* Admin Panel-only visible to admins */}
              {user?.role === "admin" && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    isActive
                      ? "nav-btn active-nav-btn admin-nav-active"
                      : "nav-btn"
                  }
                >
                  Admin Panel
                </NavLink>
              )}
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  isActive ? "nav-btn active-nav-btn" : "nav-btn"
                }
              >
                Profile
              </NavLink>
              {/* Logout button */}
              <button className="nav-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-btn">
                Log In
              </Link>
              <Link to="/register" className="nav-btn">
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Content */}
      <div className="listings">
        <h1>My Profile</h1>
        <p>Manage your profile picture and account details.</p>

        {loading ? (
          <p className="explore-status">Loading profile...</p>
        ) : (
          <div className="profile-layout">
            {/* Left column */}
            <div className="profile-left feature-card">
              {/* Profile picture */}
              <div className="profile-wrapper">
                <img
                  src={isBroken ? "/default-pp.png" : picPreview}
                  alt="Profile pic"
                  onError={() => {
                    setIsBroken(true);
                  }}
                />
              </div>

              {/* Display name */}
              <p className="profile-left-displayname">
                {profile?.displayName || profile?.username || user?.username}
              </p>
              {/* @Username */}
              <p className="profile-left-username">@{user?.username}</p>
              {user?.role === "admin" && (
                <span className="role-badge role-admin">Admin</span>
              )}
            </div>

            {/* Right column */}
            <div className="feature-card profile-right">
              {/* Success/Error feedback */}
              {success && <div className="auth-success">{success}</div>}
              {error && (
                <div className="auth-error" role="alert">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSave} className="event-form">
                {/* Profile Info */}
                <h3>Profile Info</h3>

                {/* Display Name */}
                <div className="event-form-row">
                  <label>Display Name</label>
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    placeholder={user?.username || "Your public display name"}
                    disabled={saving}
                  />
                </div>

                {/* Photo URL */}
                <div className="event-form-row">
                  <label>Photo URL</label>
                  <input
                    type="text"
                    name="profilePicUrl"
                    value={formData.profilePicUrl}
                    onChange={handleChange}
                    placeholder="https://example-photo.com"
                    disabled={saving}
                  />
                </div>

                <div className="profile-right-divider" />

                {/* Password Change */}
                <h3>
                  Change Password{" "}
                  <span className="profile-pw-hint">
                    Leave blank to keep your current password
                  </span>
                </h3>

                <div className="event-form-row">
                  <label>Current</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    placeholder="Current password"
                    disabled={saving}
                  />
                </div>

                <div className="event-form-row">
                  <label>New</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="New password (minimum 6 characters)"
                    disabled={saving}
                  />
                </div>

                <div className="event-form-row">
                  <label>Confirm</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm new password"
                    disabled={saving}
                  />
                </div>

                {/* Save Changes Button */}
                <button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
