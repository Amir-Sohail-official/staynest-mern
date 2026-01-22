import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import flash from "connect-flash";
import passport from "passport";
import LocalStrategy from "passport-local";
import path from "path";
import { fileURLToPath } from "url";

// Routes and models
import listingRouter from "../routes/listing.js";
import reviewRouter from "../routes/review.js";
import userRouter from "../routes/user.js";
import User from "../models/user.js";
import ExpressError from "../utils/ExpressError.js";

// Needed for __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));
app.use(session({
  secret: process.env.SESSION_SECRET || "mysupersecretcode",
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 7*24*60*60*1000, httpOnly: true }
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// Set view engine
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "ejs");

// Connect to MongoDB
let isConnected = false;
async function main() {
  if (!isConnected) {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
  }
}
main().then(() => console.log("MongoDB Connected")).catch(err => console.log(err));

// Routes
app.use("/listing", listingRouter);
app.use("/listing/:id/review", reviewRouter);
app.use("/", userRouter);

// Error handling
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("./listings/error.ejs", { message });
});

// ✅ EXPORT APP for Vercel
export default app;
