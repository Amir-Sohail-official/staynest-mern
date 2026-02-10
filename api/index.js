if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("../models/user.js");

const ExpressError = require("../utils/ExpressError.js");
const listingRouter = require("../routes/listing.js");
const reviewRouter = require("../routes/review.js");
const userRouter = require("../routes/user.js");

const app = express();

/* -------------------- VIEW ENGINE -------------------- */
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));
app.use(express.static(path.join(__dirname, "..", "public")));

/* -------------------- MIDDLEWARE -------------------- */
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

/* -------------------- DATABASE -------------------- */
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("MongoDB connected!");
    return cached.conn;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err; // must throw so function fails safely
  }
}

/* -------------------- SESSION -------------------- */
async function setupSession() {
  try {
    await dbConnect(); // connect to DB first

    const store = MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      touchAfter: 24 * 3600,
    });

    store.on("error", function (e) {
      console.error("SESSION STORE ERROR", e);
    });

    const sessionOptions = {
      store,
      secret: process.env.SESSION_SECRET || "mysupersecretcode",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    };

    app.use(session(sessionOptions));
  } catch (err) {
    console.error("Failed to set up session:", err);
  }
}

/* -------------------- PASSPORT -------------------- */
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/* -------------------- FLASH & LOCALS -------------------- */
app.use(flash());
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

/* -------------------- HOME ROUTE -------------------- */
app.get("/", (req, res) => {
  res.redirect("/listing");
});

/* -------------------- ROUTES -------------------- */
app.use("/listing", listingRouter);
app.use("/listing/:id/review", reviewRouter);
app.use("/", userRouter);

/* -------------------- 404 -------------------- */
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

/* -------------------- ERROR HANDLER -------------------- */
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("listings/error", { message });
});

/* -------------------- EXPORT APP -------------------- */
setupSession(); // initialize session after DB
module.exports = app;
