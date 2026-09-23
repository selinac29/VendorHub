function verifyAdmin(req, res, next) {
  // Check if the user object exists on the request
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Please log in first." });
  }

  // Check the user's role
  if (req.user.role !== "admin") {
    // 403 Forbidden means "I know who you are, but you don't have permission to do this."
    return res
      .status(403)
      .json({ message: "Forbidden: Admin privileges required." });
  }

  // If user is an admin, let them pass to the actual route controller
  next();
}

module.exports = verifyAdmin;
