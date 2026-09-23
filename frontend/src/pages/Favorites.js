import { useContext, useState, useEffect } from "react";
import { useNavigate, NavLink, Link } from "react-router-dom";
import { AuthContext, useAuth } from "../context/AuthContext";
import { PORT } from "../config";
import "../App.css";

function Favorites() {
  const { isAuthenticated } = useAuth();
  const { user, logout, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch favorites
  useEffect(() => {
    if (!token) return;

    async function fetchFavorites() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${PORT}/api/events/favorites`,
          { headers: { Authorization: token } },
        );
        const data = await res.json();
        if (res.ok) {
          setFavorites(Array.isArray(data) ? data : []);
        } else {
          setError(data.error || "Failed to load favorites.");
        }
      } catch {
        setError("Could not connect to server.");
      } finally {
        setLoading(false);
      }
    }

    fetchFavorites();
  }, [token]);

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  // Navigate to Details page when a map pin's details are clicked
  function handleDetailsClick(event) {
    navigate(`/events/${event._id}`);
  }

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
          {isAuthenticated && (
            <NavLink
              to="/favorites"
              className={({ isActive }) =>
                isActive ? "nav-btn active-nav-btn" : "nav-btn"
              }
            >
              Favorites
            </NavLink>
          )}
          {isAuthenticated ? (
            <>
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

      {/* Favorited Listings */}
      <div className="listings">
        <h1>My Favorites</h1>
        <p>Events you've saved for later.</p>

        {loading && <p className="explore-status">Loading favorites...</p>}
        {error && <p className="explore-status explore-error">{error}</p>}

        {!loading && !error && favorites.length === 0 && (
          <div className="explore-status">
            <p>Nothing to see here yet!</p>
          </div>
        )}

        {!loading && favorites.length > 0 && (
          <div className="explore-grid">
            {favorites.map((event) => (
              <div
                key={event._id}
                className="explore-card"
                style={{ cursor: "pointer", position: "relative" }}
              >
                {/* Cick on the card to view Details page */}
                <div onClick={() => handleDetailsClick(event)}>
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
                        {/* Display the fallback img if images do not exist */}
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

                  <div className="explore-card-category">
                    {event.category || "other"}
                  </div>
                  <h3>{event.name}</h3>
                  {event.description && (
                    <p style={{ color: "white" }}>{event.description}</p>
                  )}
                  {event.location?.address && (
                    <div className="explore-card-location">
                      <svg
                        width="25"
                        height="25"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                        <circle cx="12" cy="9" r="2.5" />
                      </svg>
                      {event.location.address}
                    </div>
                  )}
                  <div className="explore-card-pill-row">
                    <span className="explore-card-pill">
                      {event.entranceFee === "free"
                        ? "Free Admission"
                        : "Paid Admission"}
                    </span>
                    {event.priceRange && (
                      <span className="explore-card-pill">
                        {event.priceRange}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Favorites;
