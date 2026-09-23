import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PORT } from "../config";
import "../App.css";

function Register() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Handle input changes
  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  // Register
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`${PORT}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        // Registration successful - redirect to login
        alert("Registration successful! Please log in.");
        navigate("/login");
      } else {
        // Registration failed - show error from server
        setError(data.message || data.error || "Registration failed");
      }
    } catch (err) {
      // Network or other unexpected error
      console.error("Registration error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="home auth-page">
      <h1>Register</h1>
      <form onSubmit={handleRegister} className="auth-form">
        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <label>Username</label>
        <input
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          required
          minLength={2}
          autoComplete="username"
          placeholder="Enter a username"
          disabled={submitting}
        />

        <label>Password</label>
        <input
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          autoComplete="new-password"
          placeholder="Enter a password"
          disabled={submitting}
        />

        <button type="submit" disabled={submitting}>
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
      <p>
        Go back to <Link to="/">Home Page</Link>
      </p>
    </div>
  );
}

export default Register;
