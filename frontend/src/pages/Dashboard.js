import { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate, NavLink, Link } from "react-router-dom";
import { useAuth, AuthContext } from "../context/AuthContext";
import { PORT } from "../config";
import "../App.css";

// Function to geocode address using Backend Geocode API
const geocodeAddress = async (address) => {
  if (!address || address.trim() === "") {
    return null;
  }

  try {
    const response = await fetch(`${PORT}/api/geocode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return {
        lat: data.lat,
        lng: data.lng,
        formattedAddress: data.formattedAddress,
      };
    } else {
      console.error("Geocoding failed:", data.error);
      return null;
    }
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

function Dashboard() {
  // Local State: managing data
  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    dateTime: "",
    entranceFee: "free",
    priceRange: "free",
    category: "other",
    address: "",
    tags: "",
    images: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [geocoding, setGeocoding] = useState(false);

  const { isAuthenticated } = useAuth();
  const { token, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (deleteError) {
      const timer = setTimeout(() => setDeleteError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [deleteError]);

  // Wrap fetchEvents in useCallback
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${PORT}/api/events/my-events`,
        {
          method: "GET",
          headers: {
            Authorization: token,
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        setEvents(Array.isArray(data) ? data : []);
      } else {
        setError(data.message || "Failed to fetch events");
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial data load: fetch events when dashboard mounts
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  }

  // Handle logout
  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  // Navigate to Details page when a map pin's details are clicked
  function handleDetailsClick(event) {
    navigate(`/events/${event._id}`);
  }

  // Create event with geocoding
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    setSuccessMessage("");
    setSubmitting(true);

    // Prepare the base event data
    const eventData = {
      name: formData.name || "New event",
      description: formData.description || "",
      dateTime: formData.dateTime || null,
      entranceFee: formData.entranceFee || "free",
      priceRange: formData.priceRange || "free",
      category: formData.category,
    };

    let geoResult = null;

    // If address is provided, try to geocode it via backend
    if (formData.address && formData.address.trim() !== "") {
      setGeocoding(true);
      geoResult = await geocodeAddress(formData.address);

      if (geoResult) {
        eventData.location = {
          address: geoResult.formattedAddress || formData.address,
          city: "Vancouver",
          coordinates: {
            lat: geoResult.lat,
            lng: geoResult.lng,
          },
        };
      } else {
        // If geocoding fails, save the address without coordinates
        eventData.location = {
          address: formData.address,
          city: "Vancouver",
          coordinates: {
            lat: null,
            lng: null,
          },
        };
      }
      setGeocoding(false);
    } else {
      // No address provided
      eventData.location = {
        address: "",
        city: "Vancouver",
        coordinates: {
          lat: null,
          lng: null,
        },
      };
    }

    // Images are split by a comma; parse image URLs to an array
    eventData.images = formData.images
      .split(",")
      .map((url) => url.trim())
      .filter((url) => url !== "");

    try {
      const response = await fetch(`${PORT}/api/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (response.ok) {
        // Add new event to local state
        setEvents([...events, data]);
        // Clear form
        setFormData({
          name: "",
          description: "",
          dateTime: "",
          entranceFee: "free",
          priceRange: "free",
          category: "other",
          address: "",
          tags: "",
          images: "",
        });
        setSuccessMessage(
          geoResult && geoResult.lat && geoResult.lng
            ? "Event created successfully with location on map!"
            : "Event created successfully! (Location may not appear on map)",
        );
      } else {
        setSubmitError(data.message || data.error || "Failed to create event");
      }
    } catch (err) {
      console.error("Create event error:", err);
      setSubmitError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Delete event
  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this event?")) {
      return;
    }

    try {
      const response = await fetch(
        `${PORT}/api/events/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: token,
          },
        },
      );

      if (response.ok) {
        // Remove from local state
        setEvents(events.filter((event) => event._id !== id));
        setSuccessMessage("Event deleted successfully!");
      } else {
        const data = await response.json().catch(() => ({}));
        setDeleteError(data.message || "Failed to delete event");
      }
    } catch (err) {
      console.error("Delete event error:", err);
      setDeleteError("An error occurred. Please try again.");
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

      {/* Dashboard */}
      <div className="listings">
        {/* Personalized Greeting with extracted username */}
        {user && <h1>Welcome back, {user.displayName || user.username}!</h1>}
        <p>Manage your listing from your dashboard.</p>

        {/* Successful Upload Message */}
        {successMessage && <div className="auth-success">{successMessage}</div>}

        {/* Delete Error Message */}
        {deleteError && (
          <div role="alert" className="auth-error">
            {deleteError}
          </div>
        )}

        <div className="content-wrapper">
          {/* Create A New Event */}
          <div className="create-panel">
            <div className="feature-card">
              <h3>Create A New Event</h3>

              {submitError && (
                <div className="auth-error" role="alert">
                  {submitError}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="event-form">
                {/* Event Name */}
                <div className="event-form-row">
                  <label>Event Name</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={submitting || geocoding}
                    placeholder="Enter event name"
                  />
                </div>

                {/* Description */}
                <div className="event-form-row">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    disabled={submitting || geocoding}
                    rows="3"
                  />
                </div>

                {/* Date & Time */}
                <div className="event-form-row">
                  <label>Date & Time</label>
                  <input
                    type="datetime-local"
                    name="dateTime"
                    value={formData.dateTime}
                    onChange={handleChange}
                    disabled={submitting || geocoding}
                  />
                </div>

                {/* Entry Fee */}
                <div className="event-form-row">
                  <label>Entrance Fee</label>
                  <select
                    name="entranceFee"
                    value={formData.entranceFee}
                    onChange={handleChange}
                    disabled={submitting || geocoding}
                  >
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                {/* Price Range */}
                <div className="event-form-row">
                  <label>Price Range</label>
                  <select
                    name="priceRange"
                    value={formData.priceRange}
                    onChange={handleChange}
                    disabled={submitting || geocoding}
                  >
                    <option value="free">Free</option>
                    <option value="$">$: under $10</option>
                    <option value="$$">$$: $10 to $20</option>
                    <option value="$$$">$$$: over $20</option>
                  </select>
                </div>

                {/* Address Field */}
                <div className="event-form-row">
                  <label>Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={submitting || geocoding}
                    placeholder="Enter address in Vancouver"
                  />
                </div>

                {/* Category */}
                <div className="event-form-row">
                  <label>Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    disabled={submitting || geocoding}
                  >
                    <option value="food-beverages">Food & Beverages</option>
                    <option value="crafts">Crafts</option>
                    <option value="vintage">Vintage</option>
                    <option value="arts-prints">Arts & Prints</option>
                    <option value="beauty-skincare">Beauty & Skincare</option>
                    <option value="home-goods">Home Goods</option>
                    <option value="activities-services">
                      Activities & Services
                    </option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Photo URLs */}
                <div className="event-form-row">
                  <label>Photo URLs</label>
                  <input
                    type="text"
                    name="images"
                    value={formData.images}
                    onChange={handleChange}
                    disabled={submitting || geocoding}
                    placeholder="https://photo1.com, https://photo2.com ..."
                  />
                </div>

                {/* Create button */}
                <button type="submit" disabled={submitting || geocoding}>
                  {geocoding
                    ? "Finding location..."
                    : submitting
                      ? "Creating..."
                      : "Create Event"}
                </button>
              </form>
            </div>
          </div>

          <div className="my-events-panel">
            <h2>My Events</h2>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            {loading ? (
              <p>Loading events...</p>
            ) : (
              <div className="event-grid">
                {events.length === 0 ? (
                  <p>No events found. List your first event!</p>
                ) : (
                  events.map((event) => (
                    <div
                      key={event._id}
                      className="event-card"
                      onClick={() => handleDetailsClick(event)}
                    >
                      {/* Photo */}
                      <div className="explore-card-image">
                        {/* Display the first image if images exist */}
                        {event.images && event.images.length > 0 ? (
                          <img
                            src={event.images[0]}
                            alt={event.name}
                            className="explore-card-bg-img"
                          />
                        ) : (
                          <>
                            {/* Display the unavailable image if images do not exist */}
                            <img
                              src="/street-food.svg"
                              alt="Vendor display Unavailable"
                              className="explore-card-bg-img"
                            />
                            <div className="explore-card-img-overlay" />
                            <svg
                              className="explore-card-no-image-icon"
                              fill="white"
                              viewBox="0 0 32 32"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M30,3.4141,28.5859,2,2,28.5859,3.4141,30l2-2H26a2.0027,2.0027,0,0,0,2-2V5.4141ZM26,26H7.4141l7.7929-7.793,2.3788,2.3787a2,2,0,0,0,2.8284,0L22,19l4,3.9973Zm0-5.8318-2.5858-2.5859a2,2,0,0,0-2.8284,0L19,19.1682l-2.377-2.3771L26,7.4141Z" />
                              <path d="M6,22V19l5-4.9966,1.3733,1.3733,1.4159-1.416-1.375-1.375a2,2,0,0,0-2.8284,0L6,16.1716V6H22V4H6A2.002,2.002,0,0,0,4,6V22Z" />
                            </svg>
                          </>
                        )}
                      </div>

                      <div className="event-card-category">
                        {event.category || "other"}
                      </div>
                      <h3>{event.name}</h3>
                      {event.description && <p>{event.description}</p>}
                      {event.location?.address && (
                        <div className="event-card-location">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                            <circle cx="12" cy="9" r="2.5" />
                          </svg>
                          {event.location.address}
                        </div>
                      )}
                      <div className="event-card-pill-row">
                        <span className="event-card-pill">
                          {event.entranceFee === "free"
                            ? "Free Admission"
                            : "Paid Admission"}
                        </span>
                        {event.priceRange && (
                          <span className="event-card-pill">
                            {event.priceRange}
                          </span>
                        )}
                      </div>
                      <div className="edit-buttons-group">
                        {/* Edit button */}
                        <button
                          className="delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/events/${event._id}/edit`);
                          }}
                          disabled={submitting}
                        >
                          Edit
                        </button>
                        {/* Delete button */}
                        <button
                          className="delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(event._id);
                          }}
                          disabled={submitting}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
