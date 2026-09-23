const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const User = require("../models/User");
const verifyToken = require("../middleware/authMiddleware");
const verifyAdmin = require("../middleware/verifyAdmin");

// GET — public: list of events (visitors can browse)
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().populate("owner", "username");
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - protected: fetch only the events created by the logged-in user
router.get("/my-events", verifyToken, async (req, res) => {
  try {
    let events;
    // If admin, return ALL events
    if (req.user.role === "admin") {
      events = await Event.find().populate("owner", "username");
    } else {
      // Regular users only see their own events
      events = await Event.find({ owner: req.user.id }).populate(
        "owner",
        "username",
      );
    }
    res.json(events);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error in retrieving my events", error: err.message });
  }
});

// GET - protected: fetch all favorited events by the logged-in user
router.get("/favorites", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "favorites",
      populate: {
        path: "owner",
        select: "username",
      },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN ONLY: Get all users
router.get("/admin/users", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({}, "-password"); // Exclude password field
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN ONLY: Get all events (including all user data)
router.get("/admin/all-events", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const events = await Event.find().populate("owner", "username email role");
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET by id — public
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "owner",
      "username",
    );
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST — protected: create an event (members only)
router.post("/", verifyToken, async (req, res) => {
  try {
    const event = new Event({ ...req.body, owner: req.user.id });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST — protected: add an event to favorites
router.post("/:id/favorite", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const eventId = req.params.id;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    // Only add if not already in Favorites
    if (!user.favorites.some((f) => f.toString() === eventId)) {
      user.favorites.push(eventId);
      await user.save();
    }
    res.json({
      message: "Added to favorites",
      favorites: user.favorites,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - protected: update an event (member-owned events only)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    // Allow only the owner to edit
    if (event.owner.toString() !== req.user.id && req.user.role != "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Apply updates
    const updated = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      {
        new: true,
        runValidators: true,
      },
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE — protected: delete an event (owners delete their own/ admin can delete any)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    // Allow owner or admin only
    const isOwner = event.owner && event.owner.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ error: "Forbidden: You can only delete your own events" });
    }
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE — protected: remove an event from favorites
router.delete("/:id/favorite", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.favorites = user.favorites.filter(
      (fav) => fav.toString() !== req.params.id,
    );
    await user.save();
    res.json({ message: "Removed from favorites", favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN ONLY: Delete any user
router.delete(
  "/admin/users/:userId",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Check if user exists
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

      // Delete all events created by this user
      await Event.deleteMany({ owner: userId });

      // Delete the user
      await User.findByIdAndDelete(userId);

      res.json({ message: "User and their events deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

module.exports = router;
