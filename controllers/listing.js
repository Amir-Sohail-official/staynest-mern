const Listing = require("../models/listing");
const ExpressError = require("../utils/ExpressError");

module.exports.index = async (req, res) => {
  const { category, q } = req.query;

  let filter = {};
  if (category) filter.category = category;
  if (q) filter.location = new RegExp(q.trim(), "i");

  const allListing = await Listing.find(filter);
  res.render("listings/index.ejs", {
    allListing,
    category,
    searchQuery: q,
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: { path: "author" },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing does not exist");
    return res.redirect("/listing");
  }

  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res) => {
  if (!req.file) {
    throw new ExpressError(400, "Image upload required");
  }

  const { path: url, filename } = req.file;

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };

  await newListing.save();

  req.flash("success", "New listing added");
  res.redirect("/listing");
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing does not exist");
    return res.redirect("/listing");
  }

  const originalImageUrl = listing.image.url.replace(
    "/upload",
    "/upload/w_150",
  );

  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findByIdAndUpdate(
    id,
    { ...req.body.listing },
    { new: true },
  );

  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
    await listing.save();
  }

  req.flash("success", "Listing updated");
  res.redirect(`/listing/${id}`);
};

module.exports.deleteListing = async (req, res) => {
  const { id } = req.params;

  await Listing.findByIdAndDelete(id);

  req.flash("success", "Listing deleted");
  res.redirect("/listing");
};
