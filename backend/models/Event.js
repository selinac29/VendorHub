const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    dateTime: { type: Date },
    entranceFee: {
      type: String,
      enum: ["free", "paid"],
      default: "free",
    },
    priceRange: {
      type: String,
      enum: ["free", "$", "$$", "$$$"],
      default: "free",
    },
    category: {
      type: String,
      enum: [
        "food-beverages",
        "crafts",
        "vintage",
        "arts-prints",
        "beauty-skincare",
        "home-goods",
        "activities-services",
        "other",
      ],
      default: "other",
    },
    tags: [{ type: String }],
    location: {
      address: String,
      city: { type: String, default: "Vancouver" },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    images: [{ type: String }],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Points to the User collection
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Event", EventSchema);
