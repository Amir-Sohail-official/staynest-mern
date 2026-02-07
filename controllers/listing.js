const Listing = require("../models/listing");
module.exports.index = async (req, res) => {
  const { category, q } = req.query; // category from navbar, q for search

  let filter = {};
  if (category) {
    filter.category = category;
  }
  if (q) {
    filter.location = new RegExp(q.trim(), "i");
  }
  const allListing = await Listing.find(filter);
  res.render("listings/index.ejs", { allListing, category, searchQuery: q });
};

module.exports.renderNewForm = (req, res) => {
  res.render("./listings/new.ejs");
};
module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner")
    .lean();

  if (!listing) {
    req.flash("error", "listing you requested for does not existed");
    return res.redirect("/listing");
  }
  console.log(listing);
  res.render("./listings/show.ejs", { listing });
};
module.exports.createListing = async (req, res, next) => {
  let url = req.file.path;
  let filename = req.file.filename;
  let newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };
  await newListing.save();
  req.flash("success", "new listing added");
  res.redirect("/listing");
};
module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requesting does  not exist!");
    return res.redirect("/listings");
  }
  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_150");

  res.render("./listings/edit.ejs", { listing, originalImageUrl });
};
module.exports.updateListing = async (req, res) => {
  if (!req.body.listing) {
    throw new ExpressError(400, "send valid data for listing");
  }

  let { id } = req.params;
  let updatedListing = await Listing.findByIdAndUpdate(id, {
    ...req.body.listing,
  });
  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    updatedListing.image = { url, filename };
    await updatedListing.save();
  }
  req.flash("success", "the listing updated");
  console.log(updatedListing);
  res.redirect(`/listing/${id}`);
};
module.exports.deleteListing = async (req, res) => {
  let { id } = req.params;
  let deleteListing = await Listing.findByIdAndDelete(id);
  req.flash("success", "the listing deleted");
  console.log(deleteListing);
  res.redirect("/listing");
};
