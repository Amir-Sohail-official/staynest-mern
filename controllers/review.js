const Review = require("../models/review.js");
const Listing = require("../models/listing");
module.exports.createReview = async (req, res) => {
    const { id } = req.params;
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();
    req.flash("success","new Review added"); 
    res.redirect(`/listing/${id}`);
  }
  module.exports.deleteReview = async (req, res) => {
    let { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash("success","Review deleted"); 
    res.redirect(`/listing/${id}`);
  }