const User = require("../models/user");
module.exports.renderSignUp =  (req, res) => {
  res.render("users/signup.ejs");
}
module.exports.signUp = async (req, res) => {
    try {
      let { username, email, password } = req.body;
      const newUser = new User({ email, username });
      const userRegistered = await User.register(newUser, password);
      req.flash("success", "wellcome to wandurlust");
      console.log(userRegistered);
      req.login(userRegistered, (err) => {
        if (err) {
          return next(err);
        }
        req.flash("success", "wellcome to wandurlust");
        res.redirect("/listing");
      });
    } catch (e) {
      req.flash("error", e.message);
      res.redirect("/signup");
    }
  }
  module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
}
module.exports.login = async (req, res) => {
    req.flash("success", "wellcome to wanderlust");
    let redirectUrl = res.locals.redirectUrl || "/listing";
    res.redirect(redirectUrl);
  }
  module.exports.logout =  (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "you are logged out");
    res.redirect("/listing");
  });
}