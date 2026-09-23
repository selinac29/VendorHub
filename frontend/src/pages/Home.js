import { useContext } from "react";
import { useNavigate, Link, NavLink } from "react-router-dom";
import { useAuth, AuthContext } from "../context/AuthContext";
import "../App.css";

function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  // Handle logout
  function handleLogout() {
    logout();
    navigate("/", { replace: true });
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

      {/* Hero - left */}
      <section className="home-hero">
        <div className="home-hero-left">
          <div className="home-location-pill">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            Vancouver, BC
          </div>
          <h1 className="headline">
            Discover
            <br />
            Local Vendors
            <br />
            &amp; Markets
          </h1>

          <p>
            Discover nearby independent vendors, pop-up markets,
            <br />
            and micro events in your community.
          </p>

          {/* Action Buttons - Hide Get Started when logged in */}
          <div className="home-action-row">
            {!isAuthenticated && (
              <Link to="/register" className="action-btn action-btn-white">
                Get Started
              </Link>
            )}
            <Link to="/explore" className="action-btn action-btn-transparent">
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16.6725 16.6412L21 21M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
                  stroke="#fff"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Explore Events
            </Link>
          </div>

          {/* Stats */}
          <div className="home-stats">
            <div className="stat-item">
              <p className="stat-number">80 +</p>
              <p className="stat-label">Food Vendors</p>
            </div>
            <div className="stat-item">
              <p className="stat-number">50 +</p>
              <p className="stat-label">Micro Events</p>
            </div>
            <div className="stat-item">
              <p className="stat-number">20 +</p>
              <p className="stat-label">Markets</p>
            </div>
          </div>
        </div>

        {/* Hero - right */}
        <div className="home-hero-right">
          <div className="hero-card-outer">
            <div className="hero-card-inner">
              <img
                src="/christmas-markets-south-bank-christmas.jpg"
                width="500"
                height="500"
                alt="Christmas market"
              />
              <div className="notification-card">
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
                  <div className="notification-title">Weekend Market</div>
                  <div className="notification-text">This Saturday</div>
                </div>
              </div>
              <div className="notification-card">
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
                  <div className="notification-title">Near You</div>
                  <div className="notification-text">0.8 km away</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="home-features">
        <div className="feature-card">
          <div className="feature-icon">
            <svg
              fill="#fff"
              height="26"
              width="26"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="7.9" r="2" />
              <path
                d="M4.7,24c-0.3,0-0.5-0.1-0.8-0.2C3.3,23.5,3,22.9,3,22.2v-3.6c0-1.3,0.4-2.3,1.1-3l2-2.1C6,12.4,6,11.2,6,10
			c0-7.8,5.4-9.8,5.7-9.9L12,0l0.3,0.1c0.2,0.1,5.7,2,5.7,9.9c0,1.2,0,2.4-0.1,3.5l2,2.1c0.7,0.7,1.1,1.7,1.1,3v3.6
			c0,0.7-0.3,1.2-0.8,1.5C19.6,24,19,24,18.4,23.6L16,21.8l-1.4,2.1H9.5l-1.4-2l-2.4,1.8C5.4,23.9,5,24,4.7,24z M10.5,21.9h2.9
			l0.7-1H9.8L10.5,21.9z M12,2.1c-1,0.5-4,2.4-4,7.8c0,1.3,0.1,2.6,0.2,3.8v0.5L5.5,17C5.1,17.4,5,17.9,5,18.6v3.1l2.3-1.8
			c0.2-0.1,0.3-0.2,0.4-0.2c0.5-0.4,1.2-0.8,2-0.8h4.6c0.9,0,1.6,0.5,2.2,0.9l0.2,0.1l2.3,1.7v-3c0-0.7-0.2-1.2-0.5-1.6l0,0
			l-2.7-2.8v-0.5c0.1-1.2,0.2-2.5,0.2-3.8C16,4.5,13,2.6,12,2.1z"
              />
            </svg>
          </div>
          <h3>Launch Your Own</h3>
          <p>Create and list your own event in your neighborhood</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <svg
              width="33"
              height="33"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 16.584V18.9996C10 20.1042 10.8954 20.9996 12 20.9996C13.1046 20.9996 14 20.1042 14 18.9996L14 16.584M12 3V4M18.3643 5.63574L17.6572 6.34285M5.63574 5.63574L6.34285 6.34285M4 12H3M21 12H20M17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12Z"
                stroke="#fff"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h3>Plan Visits</h3>
          <p>
            Browse upcoming nearby events and pop-up markets at your convenience
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <svg
              width="30"
              height="30"
              viewBox="0 0 16 16"
              version="1.1"
              fill="none"
              stroke="#fff"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.1"
            >
              <circle cx="5" cy="9" r="2.25" />
              <circle cx="11" cy="4" r="2.25" />
              <path d="m7.75 9.25c0-1 .75-3 3.25-3s3.25 2 3.25 3m-12.5 5c0-1 .75-3 3.25-3s3.25 2 3.25 3" />
            </svg>
          </div>
          <h3>Support Small</h3>
          <p>Help local businesses thrive by shopping at community markets</p>
        </div>
      </section>
    </div>
  );
}

export default Home;
