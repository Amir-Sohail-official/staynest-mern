const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

if (process.env.NODE_ENV !== "production") {
  // Safe to require dotenv only in non-production environments
  try {
    require("dotenv").config();
  } catch (e) {
    // ignore if dotenv is not available in the serverless runtime
  }
}

// View engine & static files
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// ------------------- MongoDB Atlas Connection -------------------
async function connectDB() {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is not defined in environment variables");
    return;
  }

  // Reuse existing connection in serverless / Vercel environment
  if (mongoose.connection.readyState === 1) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
    });
    console.log("✅ MongoDB Atlas connection successful");
  } catch (err) {
    console.error("❌ MongoDB Atlas connection error:", err);
  }
}

connectDB();
// ---------------------------------------------------------------

// Session store (Mongo) - guard against missing/invalid MONGO_URI so the app doesn't crash
let sessionStore;
if (process.env.MONGO_URI) {
  try {
    sessionStore = MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      touchAfter: 24 * 3600, // Lazy update once per day
    });
  } catch (e) {
    console.error("❌ Mongo session store connection error:", e);
  }
} else {
  console.warn("⚠️  MONGO_URI not set - using in-memory session store");
}

// Session config
const sessionOptions = {
  secret: process.env.SESSION_SECRET || "mysupersecretcode",
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

if (sessionStore) {
  sessionOptions.store = sessionStore;
}
app.use(session(sessionOptions));
app.use(flash());

// Passport config
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash & current user middleware
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// Routers
app.use("/listing", listingRouter);
app.use("/listing/:id/review", reviewRouter);
app.use("/", userRouter);

// 404 Error handler
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// Global error handler
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("./listings/error.ejs", { message });
});

module.exports = app;


