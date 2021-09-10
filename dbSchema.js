var mongoose = require("mongoose");

var userSchema = new mongoose.Schema({
  username: String,
  created: Date,
  count: Number,
  log: [{
    description: String,
    duration: Number,
    date: String
}]
});

module.exports = mongoose.model("userLIST", userSchema, "users");
