import { useContext, useEffect, useState, useRef } from "react";
import { useAuth, AuthContext } from "../context/AuthContext";
import { useNavigate, NavLink, Link } from "react-router-dom";
import { PORT } from "../config";
import EventMap from "../components/EventMap";
import "../App.css";

function Explore() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    priceRange: "",
    entranceFee: "",
  });
  const { user, logout } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("cards");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [mapEvents, setMapEvents] = useState([]);
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);
  const mapContainerRef = useRef(null);

  useEffect(() => {
    async function fetchListings() {
      try {
        const response = await fetch(`${PORT}/api/events`);
        const data = await response.json();
        if (response.ok) {
          setListings(Array.isArray(data) ? data : []);
          // Prepare events for map
          const eventsWithCoords = (Array.isArray(data) ? data : []).filter(
            (event) =>
              event.location?.coordinates?.lat &&
              event.location?.coordinates?.lng,
          );
          setMapEvents(eventsWithCoords);
        } else {
          setError(data.error || "Failed to load listings.");
        }
      } catch (err) {
        setError("Could not connect to server.");
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, []);

  // Handle logout
  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  // Handle updating the filter upon selection
  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
  }

  // Handle resetting the filter
  function handleReset() {
    setFilters({
      category: "",
      priceRange: "",
      entranceFee: "",
    });
    setSearchQuery("");
    setSelectedEvent(null);
  }

  // Handle marker click on map
  function handleMarkerClick(event) {
    setSelectedEvent(event);
    // Scroll to the card if on cards tab
    if (activeTab === "cards" && event) {
      const cardElement = document.getElementById(`event-${event._id}`);
      if (cardElement) {
        cardElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  // Handle card click to center map on that event
  function handleCardClick(event) {
    if (activeTab === "map" && event.location?.coordinates?.lat) {
      setSelectedEvent(event);
    }
  }

  // Navigate to Details page when a map pin's details are clicked
  function handleDetailsClick(event) {
    navigate(`/events/${event._id}`);
  }

  // Filter events by search query
  const filterBySearchQuery = (items) => {
    if (!searchQuery) return items;
    const searchLower = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.name?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.location?.address?.toLowerCase().includes(searchLower) ||
        item.category?.toLowerCase().includes(searchLower),
    );
  };

  // Filter Listing for Cards View
  const filteredListings = filterBySearchQuery(listings)
    .filter((e) => !filters.category || e.category === filters.category)
    .filter((e) => !filters.priceRange || e.priceRange === filters.priceRange)
    .filter(
      (e) => !filters.entranceFee || e.entranceFee === filters.entranceFee,
    );

  // Filtered map events
  const filteredMapEvents = filterBySearchQuery(mapEvents)
    .filter((e) => !filters.category || e.category === filters.category)
    .filter((e) => !filters.priceRange || e.priceRange === filters.priceRange)
    .filter(
      (e) => !filters.entranceFee || e.entranceFee === filters.entranceFee,
    );

  // Returns true if at least one filter is selected
  const isFilterSelected =
    Object.values(filters).filter((v) => v !== "").length > 0 ||
    searchQuery !== "";

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

      {/* Listings */}
      <div className="listings">
        <h1>Explore Vendors</h1>
        <p>Discover local vendors and markets near you in Vancouver.</p>

        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="filter-group">
            {/* Filter for Category */}
            <div className="filter">
              <label>Category</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
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

            {/* Filter for Entrance Fee */}
            <div className="filter">
              <label>Entrance Fee</label>
              <select
                name="entranceFee"
                value={filters.entranceFee}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            {/* Filter for Price Range */}
            <div className="filter">
              <label>Price Range</label>
              <select
                name="priceRange"
                value={filters.priceRange}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="free">Free</option>
                <option value="$">$: under $10</option>
                <option value="$$">$$: $10 to $20</option>
                <option value="$$$">$$$: over $20</option>
              </select>
            </div>

            {/* Search Bar */}
            <div className="filter">
              <label>Search</label>
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Reset Button - only visible when a filter is selected */}
          {isFilterSelected && (
            <button className="nav-btn reset-btn" onClick={handleReset}>
              Reset Filters
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="admin-tabs" style={{ marginTop: "2rem" }}>
          <button
            className={`admin-tab ${activeTab === "cards" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("cards");
              setSelectedEvent(null);
              setIsOverlayVisible(true);
            }}
          >
            Cards View
          </button>
          <button
            className={`admin-tab ${activeTab === "map" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("map");
              setSelectedEvent(null);
              setIsOverlayVisible(true);
            }}
          >
            Map View
          </button>
        </div>

        {/* Map View with Overlay Card Column */}
        {activeTab === "map" && (
          <div className="map-view-container">
            <div className="map-wrapper" ref={mapContainerRef}>
              <EventMap
                events={filteredMapEvents}
                onMarkerClick={handleMarkerClick}
                selectedEvent={selectedEvent}
                onDetailsClick={handleDetailsClick}
              />

              {/* Overlay Card Column */}
              {isOverlayVisible && (
                <div className="map-overlay-cards">
                  <div className="overlay-header">
                    <h3>Events</h3>
                    <button
                      className="close-overlay-btn"
                      onClick={() => setIsOverlayVisible(false)}
                      aria-label="Close overlay"
                    >
                      ×
                    </button>
                  </div>
                  <div className="overlay-cards-list">
                    {filteredMapEvents.length > 0 ? (
                      filteredMapEvents.map((event) => (
                        <div
                          key={event._id}
                          className={`overlay-event-card ${selectedEvent?._id === event._id ? "active" : ""}`}
                          onClick={() => {
                            handleCardClick(event);
                            handleMarkerClick(event);
                          }}
                        >
                          {/* Photo */}
                          <div className="explore-card-image map-view-image">
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
                          <div className="explore-card-category">
                            {event.category || "other"}
                          </div>
                          <h4>{event.name}</h4>
                          {event.description && (
                            <p className="overlay-card-description">
                              {event.description.substring(0, 80)}
                              {event.description.length > 80 && "..."}
                            </p>
                          )}
                          {event.location?.address && (
                            <div className="overlay-card-location">
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
                          <div className="overlay-card-pills">
                            <span className="overlay-pill">
                              {event.entranceFee === "free"
                                ? "Free Admission"
                                : "Paid Admission"}
                            </span>
                            {event.priceRange && (
                              <span className="overlay-pill">
                                {event.priceRange}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="explore-status">
                        <p style={{ color: "black" }}>No listings found.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Overlay icon */}
              {!isOverlayVisible && (
                <button
                  className="open-overlay-btn"
                  onClick={() => setIsOverlayVisible(true)}
                  aria-label="Open overlay"
                >
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 9H4M7 3V5M17 3V5M16 15.5C16 16.3284 15.3284 17 14.5 17C13.6716 17 13 16.3284 13 15.5C13 14.6716 13.6716 14 14.5 14C15.3284 14 16 14.6716 16 15.5ZM6 21H18C19.1046 21 20 20.1046 20 19V7C20 5.89543 19.1046 5 18 5H6C4.89543 5 4 5.89543 4 7V19C4 20.1046 4.89543 21 6 21Z"
                      stroke="#ffffff"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Card View */}
        {activeTab === "cards" && (
          <>
            {loading && <p className="explore-status">Loading...</p>}
            {error && <p className="explore-status explore-error">{error}</p>}
            {!loading && !error && filteredListings.length === 0 && (
              <div className="explore-status">
                <p>No listings found.</p>
              </div>
            )}

            <div className="explore-grid">
              {filteredListings.map((event) => (
                <div
                  key={event._id}
                  id={`event-${event._id}`}
                  className="explore-card"
                  onClick={() => handleDetailsClick(event)}
                  style={{ cursor: "pointer" }}
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
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Explore;
