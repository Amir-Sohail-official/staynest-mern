const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose").default;
const userSchema = new Schema ({
  email:{
    type: String,
    required: true
  }
});
userSchema.plugin(passportLocalMongoose);
//  it is used for giving hashing function , password, user name and salting salting is to add extra string before sending the password to hashing function.
module.exports = mongoose.model('User', userSchema);