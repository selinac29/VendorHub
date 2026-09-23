import { jwtDecode } from "jwt-decode";
import { createContext, useEffect, useState, useContext } from "react";
import { PORT } from "../config";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        // Decoding the JWT to get user details
        const decoded = jwtDecode(token);
        setUser(decoded);

        // Fetching displayName & profilePicUrl
        fetch(`http://localhost:${PORT}/api/auth/profile`, {
          headers: { Authorization: token },
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((profile) => {
            if (profile) {
              setUser((prev) => ({
                ...prev,
                displayName: profile.displayName || profile.username,
                profilePicUrl: profile.profilePicUrl || "",
              }));
            }
          })
          .catch(() => {});
      } catch (err) {
        console.error("Token is invalid or corrupted:", err);
        logout();
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [token]);

  // Handles login
  function login(newToken, userData) {
    localStorage.setItem("token", newToken); // To save to browser memory
    setToken(newToken);
    setUser(userData);
  }

  //  Handles logout
  function logout() {
    localStorage.removeItem("token"); // To remove from browser memory
    setToken(null);
    setUser(null);
  }

  // Update user info
  function updateUser(updates) {
    setUser((prev) => ({ ...prev, ...updates }));
  }

  const value = {
    token,
    user,
    login,
    logout,
    updateUser,
    isAuthenticated: !!token,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
