const Listing = require("./models/listing");
const Review = require("./models/review.js");
const { ListingSchema,ReviewSchema } = require("./schema.js");
const ExpressError = require("./utils/ExpressError.js");

module.exports.isLoggedIn = (req, res, next )=>{
  req.session.redirectUrl = req.originalUrl; 
   if(!req.isAuthenticated()){
    req.flash("error", "you must be loged in to create new listing")
    return res.redirect("/login");
  }
  next();
}
module.exports.saveRedirectUrl = (req,res,next) =>{
  if(req.session.redirectUrl){
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
}

module.exports.isowner = async(req, res, next )=>{
  let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id);
    if (!listing.owner._id.equals(res.locals.currUser._id)){
      req.flash("error", "you are not the owner of this listing!")
      return res.redirect(`/listing/${id}`)
    }
  next();
}
module.exports.validateListing = (req, res, next) => {
  const { error } = ListingSchema.validate(req.body);
  if (error) {
    const errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  }
  next();
};

// function for validate review schema on server side
module.exports.validateReview = (req, res, next) => {
  let { error } = ReviewSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(404, result.error);
  } else {
    next();
  }
};
module.exports.isReviewAuthor = async(req, res, next )=>{
  let {id, reviewId } = req.params;
    let review = await Review.findByIdAndUpdate(reviewId);
    if (!review.author._id.equals(res.locals.currUser._id)){
      req.flash("error", "you are not the author of this review!")
      return res.redirect(`/listing/${id}`)
    }
  next();
}