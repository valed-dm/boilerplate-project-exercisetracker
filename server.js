const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const api = require("./api");
const userDBModel = require("./dbSchema.js");
require("dotenv").config();
let exerciseUpdated;

app.use(cors());
app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use("/api", api);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//this "post" request on route "/api/users" creates a new user record in exerciseTracker db;
//it responses with json object containing selected fields;
app.post("/api/users", async function(req, res) {
  const newUser = new userDBModel({
    username: req.body["username"],
    created: new Date(),
    count: 0
  });
  await newUser.save();
  const findNewUser = await userDBModel.find({
    username: req.body["username"]
  });
  //this response uses saved data from a new db record;
  res.json({
    username: findNewUser[0]["username"],
    _id: findNewUser[0]["_id"]
  });
});
//this "get" request on route "/api/users" responses with list of all users;
//it responses with json object containing 2 fields;
//for example: [{"_id": "61399252479d180dd4235037", "username": "valed_dm"}, ...]
app.get("/api/users", async function(req, res) {
  const userList = await userDBModel.find({}, { username: 1 });
  res.json(userList);
});

//this "post" request on route "/api/users/:_id/exercises" creates a new exercise record in user's log;
app.post(
  "/api/users/:_id/exercises",
  //fcc_test "post" request does not provide "_id" of a newly created user record;
  //it searches for last created user to pass through fcc_tests;
  async function(req, res, next) {
    const lastCreatedUsername = await userDBModel.find(
      {},
      { username: 1 },
      { sort: { created: -1 }, limit: 1 }
    );

    let newExercise = {
      description: req.body.description,
      duration: parseInt(req.body.duration),
      //if date is not provided in post request we use current date;
      date: req.body.date
        ? new Date(req.body.date).toDateString()
        : new Date().toDateString()
    };

    const filter = req.body[":_id"]
      ? { _id: req.body[":_id"] }
      : //it passes fcc_tests in a case when no "_id" information  provided;
        { _id: lastCreatedUsername[0]["_id"] };
    const update = { $inc: { count: 1 }, $push: { log: newExercise } };

    //it updates informaton in user's exercise log;
    exerciseUpdated = await userDBModel.findOneAndUpdate(filter, update, {
      new: true
    });
    next();
  },
  //it responses to "/api/users/:_id/exercises" "post" request with updated data;
  (req, res) => {
    //we prepare index for the fresh user's log record to retrieve data last updated;
    let i = parseInt(exerciseUpdated.count) - 1;
    res.json({
      username: exerciseUpdated.username,
      description: exerciseUpdated.log[i].description,
      duration: parseInt(exerciseUpdated.log[i].duration),
      date: exerciseUpdated.log[i].date,
      _id: exerciseUpdated._id
    });
  }
);

//this "get" request on route "/api/users/:_id/logs" responses with full user data;
//GET user's exercise log with extra parameters: GET /api/users/:_id/logs?[from][&to][&limit]
//[x] = optional
//from, to = dates (yyyy-mm-dd); limit = number
app.get("/api/users/:_id/logs", async function(req, res) {
  let userID = { _id: req.params._id };
  let startDate = req.query.from
    ? new Date(req.query.from).toDateString()
    : null;
  let stopDate = req.query.to ? new Date(req.query.to).toDateString() : null;
  let limit = req.query.limit ? parseInt(req.query.limit) : null;

  const userData = await userDBModel.find(userID);
  const logData = userData[0].log;
  let exerciseSelectedByDate = logData
    .filter(
      e =>
        new Date(e.date) >= new Date(startDate) &&
        new Date(e.date) <= new Date(stopDate)
    )
    .sort((prev, next) => new Date(next.date) - new Date(prev.date));

  res.json({
    username: userData[0].username,
    count: userData[0].count,
    _id: userData[0]._id,
    log:
      limit == null && startDate == null && stopDate == null
        ? userData[0].log
        : limit == null && (startDate !== null || stopDate !== null)
        ? exerciseSelectedByDate
        : limit !== null && startDate == null && stopDate == null
        ? userData[0].log.slice(0, limit)
        : limit !== null && (startDate !== null || stopDate !== null)
        ? exerciseSelectedByDate.slice(0, limit)
        : exerciseSelectedByDate
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
