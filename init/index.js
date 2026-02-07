const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") }); // load root .env

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

// ----------------- Connect to MongoDB Atlas -----------------
main()
  .then(() => console.log("✅ MongoDB Atlas connection successful"))
  .catch((err) => console.log("❌ MongoDB Atlas connection error:", err));

async function main() {
  console.log("MONGO_URI:", process.env.MONGO_URI); // debug

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined in .env");
  }

  await mongoose.connect(process.env.MONGO_URI); // ✅ modern Mongoose, no options
}

// ----------------- Seed Listings -----------------
const initDB = async () => {
  try {
    console.log("Deleting existing listings...");
    await Listing.deleteMany({});

    initData.data = initData.data.map((obj) => ({
      ...obj,
      owner: "696761f41a3f6e94306d3ec0",
    }));

    await Listing.insertMany(initData.data);
    console.log("✅ Listings data was stored in Atlas");
  } catch (err) {
    console.log("❌ Error inserting data:", err);
  } finally {
    mongoose.connection.close();
    console.log("Connection closed");
  }
};

initDB();
