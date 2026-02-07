const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const Listing = require("../models/listing"); // ✅ FIXED PATH

async function addOwner() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB Atlas");

    const result = await Listing.updateMany(
      {}, // ALL listings
      { $set: { owner: "697869a0fdc5c4f21ee3c573" } },
    );

    console.log("✅ Owner added to all listings");
    console.log("Modified documents:", result.modifiedCount);
  } catch (err) {
    console.log("❌ Error:", err);
  } finally {
    await mongoose.connection.close();
    console.log("Connection closed");
  }
}

addOwner();
