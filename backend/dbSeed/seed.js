/*
Run from backend root: node dbSeed/seed.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const Event = require("../models/Event"); // Event Schema

const MONGO_URI = process.env.MONGO_URI;

// IMPORTANT: User ID to own the seeded data (admin)
const SYSTEM_USER_ID = "69ae4e7faa020de4a174a80d";

// csv filename
const CSV_FILE_NAME = "food-vendors.csv";
const CSV_FILE_PATH = path.join(__dirname, "food-vendors.csv");

// Helper function to parse coordinates
function parseCoordinates(c) {
  if (!c) {
    return {
      lat: null,
      lng: null,
    };
  } else {
    const parts = c.split(",");
    return {
      lat: parseFloat(parts[0]),
      lng: parseFloat(parts[1]),
    };
  }
}

// Seeding to read dataset -> import rows of documents to database
async function seedDatabase() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to Database.");

    // Clear old data to prevent duplication
    console.log("Wiping existing events from collection");
    await Event.deleteMany({});
    console.log("Collection cleared.");

    const eventsToInsert = [];
    let firstRowLogged = false;

    if (!fs.existsSync(CSV_FILE_PATH)) {
      console.error(`❌ Error: File not found at ${CSV_FILE_PATH}`);
      process.exit(1);
    }

    console.log(`Reading and parsing: ${CSV_FILE_NAME}...`);

    // Read CSV file
    fs.createReadStream(CSV_FILE_PATH)
      .pipe(
        csv({
          separator: ";",
          stripBOM: true,
          mapHeaders: ({ header }) =>
            header
              .replace(/["']/g, "")
              .replace(/[^\x20-\x7E]/g, "")
              .trim()
              .toLowerCase(),
        }),
      )
      .on("data", (row) => {
        const coords = parseCoordinates(row.geo_point_2d);

        if (!firstRowLogged) {
          console.log("--- SUCCESSFUL MAPPING PREVIEW ---");
          console.log("Vendor:", row.business_name);
          console.log("Location:", row.location);
          console.log("Coordinates:", coords);
          console.log("----------------------------------");
          firstRowLogged = true;
        }

        eventsToInsert.push({
          owner: SYSTEM_USER_ID,
          name: row.business_name || "Unknown Vendor",
          description: row.description || "",
          dateTime: new Date(), // No date provided; placeholder
          entranceFee: "free",
          priceRange: "$", // No price range provided
          category: "food-beverages",
          tags: [
            row.description?.toLowerCase(),
            row.geo_localarea?.toLowerCase(),
          ].filter(Boolean),
          location: {
            address: row.location || "",
            city: "Vancouver",
            coordinates: {
              lat: coords.lat,
              lng: coords.lng,
            },
          },
          images: [],
        });
      })
      .on("end", async () => {
        if (eventsToInsert.length === 0) {
          console.error("❌ No data was parsed.");
          process.exit(1);
        }

        try {
          const result = await Event.insertMany(eventsToInsert);
          console.log(`✅ Success! Seeded ${result.length} vendor events.`);

          mongoose.connection.close();
          process.exit(0);
        } catch (err) {
          console.error("❌ Insertion failed:", err.message);
          process.exit(1);
        }
      });
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  }
}

seedDatabase();
