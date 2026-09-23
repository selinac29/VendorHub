import { useContext, useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, NavLink, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { PORT } from "../config";
import "../App.css";

function AdminDashboard() {
  const { token, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  const [deleting, setDeleting] = useState(false);

  const redirected = useRef(false);

  const fetchGlobalData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const usersResponse = await fetch(
        `${PORT}/api/auth/admin/users`,
        { headers: { Authorization: token } },
      );

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      } else {
        const errorData = await usersResponse.json().catch(() => ({}));
        alert(errorData.message || "Failed to fetch users");
      }

      const eventsResponse = await fetch(
        `${PORT}/api/events/admin/all-events`,
        { headers: { Authorization: token } },
      );

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);
      } else {
        const errorData = await eventsResponse.json().catch(() => ({}));
        alert(errorData.message || "Failed to fetch events");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      alert("Failed to load data: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (redirected.current) return;

    // Wait until user is decoded from token
    if (token && !user) return;

    if (!token) {
      redirected.current = true;

      setTimeout(() => {
        alert("401 Unauthorized: Please log in to access the admin panel.");
        navigate("/", { replace: true });
      }, 0);
      return;
    }

    if (user.role !== "admin") {
      redirected.current = true;
      setTimeout(() => {
        alert("401 Unauthorized: Only Admin can access this page.");
        navigate("/", { replace: true });
      }, 0);
      return;
    }

    // Confirmed admin
    fetchGlobalData();
  }, [token, user, navigate, fetchGlobalData]);

  const handleDeleteUser = async (userId, username) => {
    if (
      !window.confirm(
        `Are you sure you want to delete user "${username}"? This will also delete all events created by this user.`,
      )
    ) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(
        `${PORT}/api/auth/admin/users/${userId}`,
        { method: "DELETE", headers: { Authorization: token } },
      );

      if (response.ok) {
        setUsers(users.filter((u) => u._id !== userId));
        alert(`User "${username}" deleted successfully!`);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete user");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Error: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteEvent = async (eventId, eventName) => {
    if (
      !window.confirm(`Are you sure you want to delete event "${eventName}"?`)
    ) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(
        `${PORT}/api/events/${eventId}`,
        { method: "DELETE", headers: { Authorization: token } },
      );

      if (response.ok) {
        setEvents(events.filter((e) => e._id !== eventId));
        alert(`Event "${eventName}" deleted successfully!`);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete event");
      }
    } catch (err) {
      console.error("Error deleting event:", err);
      alert("Error: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  if (loading) {
    return (
      <div className="home">
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
        </nav>
        <div className="listings">
          <p className="explore-status">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home">
      {/* Nav-bar */}
      <nav className="home-nav">
        <NavLink to="/home" className="home-nav-logo">
          <div className="icon-placeholder"></div>
          <div>VendorHub</div>
        </NavLink>
        <div className="home-nav-links">
          <NavLink
            to="/explore"
            className={({ isActive }) =>
              isActive ? "nav-btn active-nav-btn" : "nav-btn"
            }
          >
            Explore
          </NavLink>
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

          {user?.role === "admin" && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                isActive ? "nav-btn active-nav-btn admin-nav-active" : "nav-btn"
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

          <Link className="nav-btn" onClick={handleLogout}>
            Logout
          </Link>
        </div>
      </nav>

      {/* Admin Dashboard Content */}
      <div className="listings">
        <h1>Admin Control Panel</h1>
        <p>Manage users and events across the platform.</p>

        {/* Tab Navigation */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            Users
          </button>
          <button
            className={`admin-tab ${activeTab === "events" ? "active" : ""}`}
            onClick={() => setActiveTab("events")}
          >
            Events
          </button>
        </div>

        {/* Users Table */}
        {activeTab === "users" && (
          <div className="admin-table-container">
            <h2>All Users</h2>
            {users.length === 0 ? (
              <p>No users found.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userItem) => (
                    <tr key={userItem._id}>
                      <td>
                        <strong>{userItem.username}</strong>
                        {userItem._id === user?.id}
                      </td>
                      <td>
                        <span className={`role-badge role-${userItem.role}`}>
                          {userItem.role}
                        </span>
                      </td>
                      <td>
                        <button
                          className="delete-btn admin-delete-btn"
                          onClick={() =>
                            handleDeleteUser(userItem._id, userItem.username)
                          }
                          disabled={deleting || userItem._id === user?.id}
                          title={
                            userItem._id === user?.id
                              ? "Cannot delete your own account"
                              : "Delete user"
                          }
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Events Table */}
        {activeTab === "events" && (
          <div className="admin-table-container">
            <h2>All Events</h2>
            {events.length === 0 ? (
              <p>No events found.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Event Name</th>
                    <th>Owner</th>
                    <th>Category</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event._id}>
                      <td>
                        <strong>{event.name}</strong>
                        {event.description && (
                          <div className="event-description-preview">
                            {event.description.substring(0, 60)}
                            {event.description.length > 60 && "..."}
                          </div>
                        )}
                      </td>
                      <td>{event.owner?.username || "Unknown"}</td>
                      <td>
                        <span className="category-badge">
                          {event.category || "other"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="delete-btn admin-delete-btn"
                          onClick={() =>
                            handleDeleteEvent(event._id, event.name)
                          }
                          disabled={deleting}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
