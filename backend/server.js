require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");
const User = require("./models/User");

const app = express();
const PORT = 5000;

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// database connection
const uri = process.env.MONGO_URI;

const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};

async function connectDB() {
  try {
    await mongoose.connect(uri, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("✅ Pinged the db. You successfully connected to MongoDB!");

    try {
      await User.collection.dropIndex("email_1");
    } catch (e) {
      if (e.code !== 27) throw e;
    }
    await User.syncIndexes();
  } catch (err) {
    console.error("❌ Connection failed:", err);
  }
}

connectDB();

// GEOCODING ENDPOINT - uses backend API key to avoid exposing it to the frontend
app.post("/api/geocode", async (req, res) => {
  try {
    const { address } = req.body;

    if (!address || address.trim() === "") {
      return res.status(400).json({ error: "Address is required" });
    }

    const fullAddress = `${address}, Vancouver, BC`;
    const apiKey = process.env.GOOGLE_MAPS_BACKEND_API_KEY;

    if (!apiKey) {
      console.error("Missing Google Maps backend API key in .env");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.append("address", fullAddress);
    url.searchParams.append("key", apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === "OK" && data.results[0]) {
      const location = data.results[0].geometry.location;
      const formattedAddress = data.results[0].formatted_address;

      res.json({
        success: true,
        lat: location.lat,
        lng: location.lng,
        formattedAddress: formattedAddress,
      });
    } else {
      console.error("Geocoding failed:", data.status);
      res.status(404).json({
        error: "Could not find coordinates for this address",
        status: data.status,
      });
    }
  } catch (err) {
    console.error("Geocoding error:", err.message);
    res.status(500).json({ error: "Geocoding service error" });
  }
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
