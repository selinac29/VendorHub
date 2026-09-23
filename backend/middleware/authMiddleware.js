const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  // Get the token from header
  const token = req.header("Authorization");

  // Check if the token exists
  if (!token) return res.status(401).json({ error: "Access denied" });

  // Verify the token
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallbackSecret",
    );

    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
    };
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = verifyToken;
