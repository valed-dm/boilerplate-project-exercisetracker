var mongoose = require("mongoose");
var express = require("express");
var router = express.Router();

// Connecting to database
mongoose.connect(
  process.env.MONGODB_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
  },
  function(error) {
    if (error) {
      console.log("Error!" + error);
    }
  }
);

module.exports = router;

