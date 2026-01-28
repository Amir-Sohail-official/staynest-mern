if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
app.use(methodOverride("_method"));

const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const session = require("express-session");
const flash = require("connect-flash");

const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

// ------------------- View Engine & Static -------------------
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine("ejs", ejsMate);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// ------------------- MongoDB Atlas (FIXED FOR VERCEL) -------------------
mongoose.set("bufferCommands", false);

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log("✅ MongoDB connected (cached)");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    throw err;
  }
}

// connect immediately
connectDB();

// ------------------- Session -------------------
const sessionOptions = {
  secret: process.env.SESSION_SECRET || "mysupersecretcode",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

app.use(session(sessionOptions));
app.use(flash());

// ------------------- Passport -------------------
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ------------------- Locals -------------------
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// ------------------- ROOT ROUTE -------------------
app.get("/", (req, res) => {
  res.send("StayNest backend is running 🚀");
});

// ------------------- Routers -------------------
app.use("/listing", listingRouter);
app.use("/listing/:id/review", reviewRouter);
app.use("/", userRouter);

// ------------------- 404 -------------------
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// ------------------- Error Handler -------------------
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("./listings/error.ejs", { message });
});

// ------------------- LOCAL SERVER ONLY -------------------
if (process.env.NODE_ENV !== "production") {
  const port = 8080;
  app.listen(port, () => {
    console.log(`✅ Local server running on http://localhost:${port}`);
  });
}

// ------------------- REQUIRED FOR VERCEL -------------------
module.exports = app;
