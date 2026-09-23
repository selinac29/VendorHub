import { useContext, useEffect, useState } from "react";
import { useNavigate, NavLink, Link, useParams } from "react-router-dom";
import { AuthContext, useAuth } from "../context/AuthContext";
import { PORT } from "../config";
import "../App.css";

// Fallback image displayed when an event has no images
const FALLBACK_IMAGE = "/street-food.svg";

function formatDateTime(dt) {
  if (!dt) return null;
  const date = new Date(dt);
  return date.toLocaleString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function categoryLabel(raw) {
  const map = {
    "food-beverages": "food & beverages",
    crafts: "crafts",
    vintage: "vintage",
    "arts-prints": "arts & prints",
    "beauty-skincare": "beauty & skincare",
    "home-goods": "home goods",
    "activities-services": "activities & services",
    other: "other",
  };
  return map[raw] || raw;
}

// Image carousel
function Carousel({ images }) {
  const [index, setIndex] = useState(0);

  // If no image is provided, use the fallback img
  const slides = images && images.length > 0 ? images : [FALLBACK_IMAGE];
  const isFallback = slides[0] === FALLBACK_IMAGE;

  function prev() {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }

  function next() {
    setIndex((i) => (i + 1) % slides.length);
  }

  return (
    <div className="details-carousel">
      {/* Carousel image */}
      <div
        className={`details-carousel-track${isFallback ? " details-carousel-fallback" : ""}`}
      >
        <img
          src={slides[index]}
          alt={`Event for ${index + 1}`}
          className="details-carousel-img"
        />

        {/* Unavailable icon overlay for fallback */}
        {isFallback && (
          <>
            <div className="explore-card-img-overlay" />
            <svg
              className="details-carousel-no-image-icon"
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

      {/* Carousel Arrows */}
      <button
        className="carousel-arrow arrow-left"
        onClick={prev}
        aria-label="Previous photo"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <button
        className="carousel-arrow arrow-right"
        onClick={next}
        aria-label="Next photo"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}

// Map
function LocationMap({ lat, lng, address }) {
  if (!lat || !lng) return null;

  return (
    <div className="details-map-wrapper">
      {/* Event Location */}
      <h3 className="details-section-heading">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
        Event Location
      </h3>

      {/* Map Card */}
      <div className="details-map-frame">
        <iframe
          title="Event Location Map"
          width="100%"
          height="280"
          style={{ border: 0, borderRadius: "12px" }}
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
        />
      </div>

      {/* Footnote - address, coordinates */}
      <p className="details-map-address">{address}</p>
      <p className="details-map-coords">
        Coordinates: {lat.toFixed(4)}, {lng.toFixed(4)}
      </p>
    </div>
  );
}

// Details
function Details() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { user, logout, token } = useContext(AuthContext);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  // Fetch the event
  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`${PORT}/api/events/${id}`);
        const data = await res.json();
        if (res.ok) {
          setEvent(data);
          //   Check if the event is in the user's favorites, if logged in
          if (token) {
            try {
              const favRes = await fetch(
                `${PORT}/api/events/favorites`,
                { headers: { Authorization: token } },
              );
              if (favRes.ok) {
                const favData = await favRes.json();
                setIsFavorited(favData.some((e) => e._id === data._id));
              }
            } catch {}
          }
        } else {
          setError(data.error || "Event not found.");
        }
      } catch {
        setError("Could not connect to server.");
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [id, token]);

  //   Handle adding/deleting a favorited event
  async function handleToggleFavorite() {
    if (!event || !token) return;
    setFavLoading(true);
    try {
      const method = isFavorited ? "DELETE" : "POST";
      const res = await fetch(
        `${PORT}/api/events/${event._id}/favorite`,
        { method, headers: { Authorization: token } },
      );
      if (res.ok) {
        setIsFavorited(!isFavorited);
      }
    } catch {
    } finally {
      setFavLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }

  // Check if the user is the owner
  const isOwner =
    user &&
    event?.owner &&
    (event.owner._id === user.id || event.owner === user.id);

  // Parse tags
  const tags = Array.isArray(event?.tags)
    ? event.tags
    : event?.tags
      ? event.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

  return (
    <div className="home">
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
        <h1>Details</h1>

        {/* Action bar - very top */}
        <div className="details-action-bar">
          <button
            className="p details-back-btn"
            onClick={() => navigate("/explore")}
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
            Back to Events
          </button>

          <div className="details-action-btns">
            {/* Edit my listing — only displayed when the event's owner is logged in */}
            {isOwner && (
              <Link to={`/events/${id}/edit`} className="details-action-btn">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20,16v4a2,2,0,0,1-2,2H4a2,2,0,0,1-2-2V6A2,2,0,0,1,4,4H8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polygon
                    fill="none"
                    points="12.5 15.8 22 6.2 17.8 2 8.3 11.5 8 16 12.5 15.8"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                  />
                </svg>
                Edit my Listing
              </Link>
            )}

            {/* Copy Link */}
            <button className="details-action-btn" onClick={handleCopyLink}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15.197 3.35462C16.8703 1.67483 19.4476 1.53865 20.9536 3.05046C22.4596 4.56228 22.3239 7.14956 20.6506 8.82935L18.2268 11.2626M10.0464 14C8.54044 12.4882 8.67609 9.90087 10.3494 8.22108L12.5 6.06212"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <path
                  d="M13.9536 10C15.4596 11.5118 15.3239 14.0991 13.6506 15.7789L11.2268 18.2121L8.80299 20.6454C7.12969 22.3252 4.55237 22.4613 3.0464 20.9495C1.54043 19.4377 1.67609 16.8504 3.34939 15.1706L5.77323 12.7373"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
              {isCopied ? "Copied!" : "Copy Link"}
            </button>

            {/* Favorite - only visible when logged in */}
            {isAuthenticated && (
              <button
                className={`details-action-btn${isFavorited ? " details-action-btn-favorited" : ""}`}
                onClick={handleToggleFavorite}
                disabled={favLoading}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill={isFavorited ? "currentColor" : "none"}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M12 6.00019C10.2006 3.90317 7.19377 3.2551 4.93923 5.17534C2.68468 7.09558 2.36727 10.3061 4.13778 12.5772C5.60984 14.4654 10.0648 18.4479 11.5249 19.7369C11.6882 19.8811 11.7699 19.9532 11.8652 19.9815C11.9483 20.0062 12.0393 20.0062 12.1225 19.9815C12.2178 19.9532 12.2994 19.8811 12.4628 19.7369C13.9229 18.4479 18.3778 14.4654 19.8499 12.5772C21.6204 10.3061 21.3417 7.07538 19.0484 5.17534C16.7551 3.2753 13.7994 3.90317 12 6.00019Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {isFavorited ? "Favorited" : "Add to Favorites"}
              </button>
            )}
          </div>
        </div>

        {/* Loading/Error */}
        {loading && <p className="explore-status">Loading event details...</p>}
        {error && <p className="explore-status explore-error">{error}</p>}

        {/* Event content */}
        {event && !loading && (
          <div className="details-content">
            {/* Carousel */}
            <Carousel images={event.images} />

            {/* Info card */}
            <div className="details-info">
              {/* Pills */}
              <div className="details-pills">
                {event.category && (
                  <span className="details-pill details-pill-category">
                    {categoryLabel(event.category)}
                  </span>
                )}
                {event.priceRange && (
                  <span className="details-pill details-pill-price">
                    {event.priceRange}
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="details-title">{event.name}</h2>

              {/* Description */}
              {event.description && (
                <p className="details-description">{event.description}</p>
              )}

              {/* Detail grid */}
              <div className="details-grid">
                {/* Date & Time */}
                {event.dateTime && (
                  <div className="details-grid-item">
                    <div className="notification-icon">
                      <svg
                        fill="currentColor"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M6,22H18a3,3,0,0,0,3-3V7a2,2,0,0,0-2-2H17V3a1,1,0,0,0-2,0V5H9V3A1,1,0,0,0,7,3V5H5A2,2,0,0,0,3,7V19A3,3,0,0,0,6,22ZM5,12.5a.5.5,0,0,1,.5-.5h13a.5.5,0,0,1,.5.5V19a1,1,0,0,1-1,1H6a1,1,0,0,1-1-1Z" />
                      </svg>
                    </div>
                    <div>
                      <p className="details-grid-label">Date & Time</p>
                      <p className="details-grid-value">
                        {formatDateTime(event.dateTime)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Entrance Fee */}
                <div className="details-grid-item">
                  <div className="notification-icon">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="2"
                      />
                      <path
                        d="M12 17V17.5V18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                      <path
                        d="M12 6V6.5V7"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                      <path
                        d="M15 9.5C15 8.11929 13.6569 7 12 7C10.3431 7 9 8.11929 9 9.5C9 10.8807 10.3431 12 12 12C13.6569 12 15 13.1193 15 14.5C15 15.8807 13.6569 17 12 17C10.3431 17 9 15.8807 9 14.5"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="details-grid-label">Entrance Fee</p>
                    <p className="details-grid-value">
                      {event.entranceFee === "free"
                        ? "Free"
                        : event.priceRange || "Paid"}
                    </p>
                  </div>
                </div>

                {/* Location */}
                {event.location?.address && (
                  <div className="details-grid-item">
                    <div className="notification-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        width="18"
                        height="18"
                      >
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                        <circle cx="12" cy="9" r="2.5" />
                      </svg>
                    </div>
                    <div>
                      <p className="details-grid-label">Location</p>
                      <p className="details-grid-value">
                        {event.location.address}
                      </p>
                      {event.location.city && (
                        <p className="details-grid-value">
                          {event.location.city}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact */}
                {event.owner?.email && (
                  <div className="details-grid-item">
                    <div className="notification-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        width="18"
                        height="18"
                      >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <div>
                      <p className="details-grid-label">Contact</p>
                      <p className="details-grid-value">{event.owner.email}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="details-tags-section">
                  <div className="details-section-heading">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7.0498 7.0498H7.0598M10.5118 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V10.5118C3 11.2455 3 11.6124 3.08289 11.9577C3.15638 12.2638 3.27759 12.5564 3.44208 12.8249C3.6276 13.1276 3.88703 13.387 4.40589 13.9059L9.10589 18.6059C10.2939 19.7939 10.888 20.388 11.5729 20.6105C12.1755 20.8063 12.8245 20.8063 13.4271 20.6105C14.112 20.388 14.7061 19.7939 15.8941 18.6059L18.6059 15.8941C19.7939 14.7061 20.388 14.112 20.6105 13.4271C20.8063 12.8245 20.8063 12.1755 20.6105 11.5729C20.388 10.888 19.7939 10.2939 18.6059 9.10589L13.9059 4.40589C13.387 3.88703 13.1276 3.6276 12.8249 3.44208C12.5564 3.27759 12.2638 3.15638 11.9577 3.08289C11.6124 3 11.2455 3 10.5118 3ZM7.5498 7.0498C7.5498 7.32595 7.32595 7.5498 7.0498 7.5498C6.77366 7.5498 6.5498 7.32595 6.5498 7.0498C6.5498 6.77366 6.77366 6.5498 7.0498 6.5498C7.32595 6.5498 7.5498 6.77366 7.5498 7.0498Z"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    Tags
                  </div>
                  <div className="details-tags">
                    {tags.map((tag, i) => (
                      <span key={i} className="details-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Map */}
              {event.location?.coordinates?.lat &&
                event.location?.coordinates?.lng && (
                  <LocationMap
                    lat={event.location.coordinates.lat}
                    lng={event.location.coordinates.lng}
                    address={event.location.address}
                  />
                )}

              {/* Organized by */}
              {event.owner && (
                <div className="details-owner">
                  <p className="details-owner-label">Organized by</p>
                  <p className="details-owner-name">
                    {event.owner.username || event.owner}
                  </p>
                  {event.owner.email && (
                    <p className="details-owner-email">{event.owner.email}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Details;
