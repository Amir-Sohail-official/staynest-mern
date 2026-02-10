if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const ejsMate = require("ejs");

const ExpressError = require("../utils/ExpressError.js");
const listingRouter = require("../routes/listing.js");
const reviewRouter = require("../routes/review.js");
const userRouter = require("../routes/user.js");

const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("../models/user.js");

/* -------------------- VIEW ENGINE -------------------- */
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));
app.use(express.static(path.join(__dirname, "..", "public")));

/* -------------------- MIDDLEWARE -------------------- */
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

/* -------------------- DATABASE (Serverless-friendly) -------------------- */
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then((mongoose) => {
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

dbConnect()
  .then(() => console.log("MongoDB Atlas connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

/* -------------------- SESSION -------------------- */
let store;
try {
  store = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    touchAfter: 24 * 3600, // 1 day
  });

  store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e);
  });
} catch (err) {
  console.log("MongoStore failed to initialize:", err);
}

const sessionOptions = {
  store,
  secret: process.env.SESSION_SECRET || "mysupersecretcode",
  resave: false,
  saveUninitialized: false, // better security
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
};

app.use(session(sessionOptions));
app.use(flash());

/* -------------------- PASSPORT -------------------- */
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/* -------------------- GLOBAL LOCALS -------------------- */
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

/* -------------------- EXPORT APP FOR VERCEL -------------------- */
module.exports = app;
