const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/authMiddleware");
const verifyAdmin = require("../middleware/verifyAdmin");

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // 2. hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. save the user
    const newUser = new User({
      username,
      password: hashedPassword,
      displayName: username,
    });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. find user
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "User not found" });

    // 2. compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // 3. generate token ("wristband")
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET || "fallbackSecret",
      { expiresIn: "24h" },
    );

    res.json({
      token,
      user: { id: user._id, username: user.username, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN ONLY: Get all users
router.get("/admin/users", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({}, "-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN ONLY: Delete a user
router.delete(
  "/admin/users/:userId",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Prevent admin from deleting themselves
      if (user._id.toString() === req.user.id) {
        return res
          .status(403)
          .json({ error: "Cannot delete your own account" });
      }

      await User.findByIdAndDelete(userId);
      res.json({ message: "User deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// GET — protected: fetch profile of the logged-in user
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id, "-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT — protected: update display name, profile pic URL
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { displayName, profilepicURL } = req.body;

    const updates = {};
    if (displayName !== undefined) updates.displayName = displayName.trim();
    if (profilepicURL !== undefined)
      updates.profilepicURL = profilepicURL.trim();

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
        select: "-password",
      },
    );

    if (!updated) return res.status(404).json({ error: "User not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT — protected: change password
router.put("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Both current and new password are required." });
    }
    if (newPassword.length < 5) {
      return res
        .status(400)
        .json({ error: "New password must be at least 5 characters." });
    }

    const user = await User.findById(req.user.id);
    // Find user
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Compare current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect." });
    }

    // Hash/save new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password changed successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
