import { useContext, useEffect, useState } from "react";
import { useNavigate, NavLink, Link, useParams } from "react-router-dom";
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

// Convert date format
function formatDateTime(dt) {
  if (!dt) return null;
  const date = new Date(dt);
  if (isNaN(date)) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function Edit() {
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [isOwner, setIsOwner] = useState(true);

  const { id } = useParams(); // id from /events/:id/edit
  const { isAuthenticated } = useAuth();
  const { token, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

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

  // Fetch event
  useEffect(() => {
    if (!token) return;

    async function fetchEvent() {
      try {
        const res = await fetch(`${PORT}/api/events/${id}`, {
          headers: { Authorization: token },
        });
        const data = await res.json();

        if (!res.ok) {
          setSubmitError(data.error || "Event not found.");
          setLoading(false);
          return;
        }

        // Check ownership
        const ownerId = data.owner?._id || data.owner;
        if (user && ownerId && ownerId.toString() !== user.id) {
          setIsOwner(false);
          setLoading(false);
          return;
        }

        // Pre-populate form with existing event data
        setFormData({
          name: data.name || "",
          description: data.description || "",
          dateTime: formatDateTime(data.dateTime),
          entranceFee: data.entranceFee || "free",
          priceRange: data.priceRange || "free",
          category: data.category || "other",
          address: data.location?.address || "",
          images: Array.isArray(data.images) ? data.images.join(", ") : "",
        });
      } catch {
        setSubmitError("Could not connect to server.");
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [id, token, user]);

  // Handle data change
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  // Handle logout
  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);

    // Prepare the update event data
    const eventData = {
      name: formData.name,
      description: formData.description,
      dateTime: formData.dateTime || null,
      entranceFee: formData.entranceFee || "free",
      priceRange: formData.priceRange || "free",
      category: formData.category,
    };

    let geoResult = null;

    // If address is provided, try to geocode it
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
      const res = await fetch(`${PORT}/api/events/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(eventData),
      });

      const data = await res.json();

      if (res.ok) {
        // Navigate back the event details upon success
        navigate(`/events/${id}`);
      } else {
        setSubmitError(data.error || data.message || "Failed to update event.");
      }
    } catch {
      setSubmitError("An error occurred.");
    } finally {
      setSubmitting(false);
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

      {/* Edit Page */}
      <div className="listings">
        <h1>Edit My Listing</h1>

        {/* Cancel button */}
        <button
          className="p details-back-btn cancel-btn"
          onClick={() => navigate(`/events/${id}`)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="20"
            height="20"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Cancel
        </button>

        {loading ? (
          <p className="explore-status">Loading event editing...</p>
        ) : (
          <div className="content-wrapper">
            {/* Edit the event */}
            <div className="create-panel">
              <div className="feature-card edit-card">
                <h3>Update The Event</h3>

                {submitError && (
                  <div className="auth-error" role="alert">
                    {submitError}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="event-form edit-form">
                  {/* Event Name */}
                  <div className="event-form-row edit-form-row">
                    <label>Event Name</label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={submitting || geocoding}
                    />
                  </div>

                  {/* Description */}
                  <div className="event-form-row edit-form-row">
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
                  <div className="event-form-row edit-form-row">
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
                  <div className="event-form-row edit-form-row">
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
                  <div className="event-form-row edit-form-row">
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

                  {/* Address */}
                  <div className="event-form-row edit-form-row">
                    <label>Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      disabled={submitting || geocoding}
                    />
                  </div>

                  {/* Category */}
                  <div className="event-form-row edit-form-row">
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
                  <div className="event-form-row edit-form-row">
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

                  {/* Update button */}
                  <button type="submit" disabled={submitting || geocoding}>
                    {geocoding
                      ? "Updating..."
                      : submitting
                        ? "Updating..."
                        : "Update Event"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Edit;
