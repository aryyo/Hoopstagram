const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../schemas/Users");
const isValidRequest = require("../middleware/middleware");

const router = express.Router();

//GET Methods
router.get("/account_info", (req, res) => {
  if (req.user) {
    //dont send password
    let formattedUser = {
      username: req.user[0].username,
      email: req.user[0].email,
      _id: req.user[0]._id,
      favoriteTeams: req.user[0].favoriteTeams,
    };

    res.status(200).send({ user: formattedUser });
  } else {
    //no user logged in
    res.sendStatus(204);
  }
});

router.get("/feed", (req, res) => {
  if (req.user) {
    res.send({ msg: "LOGGED IN" });
  } else {
    res.send({ msg: "NOT LOGGED IN" });
  }
});

router.get("/favorite_teams", async (req, res) => {
  if (req.user) {
    const user = await User.find({ username: req.user[0].username });

    res.status(200).send({ teams: user[0].favoriteTeams });
  } else {
    //no user logged in
    res.sendStatus(204);
  }
});

router.get("/games", (req, res) => {});

router.get("/teams_players", (req, res) => {});

//POST Methods

//PUT Methods
router.put("/update_info", isValidRequest, async (req, res) => {
  if (req.user) {
    let updateQuery = {};
    //array of bools for error statuses for username and email checks
    //used to send errorMsg
    let errorStatus = [false, false];

    if (req.body.info.username) {
      const usernameCheck = await User.find({
        username: req.body.info.username,
      });

      if (usernameCheck.length <= 0) {
        updateQuery.username = req.body.info.username;
      } else {
        errorStatus[0] = true;
      }
    }

    if (req.body.info.email) {
      const emailCheck = await User.find({
        email: req.body.info.email,
      });

      if (emailCheck.length <= 0) {
        updateQuery.email = req.body.info.email;
      } else {
        errorStatus[1] = true;
      }
    }

    //hashing password if present
    if (req.body.info.password) {
      let saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(req.body.info.password, salt);
      updateQuery.password = hashedPassword;
    }

    if (errorStatus[0] && errorStatus[1]) {
      return res
        .status(422)
        .send({ errorMsg: "Username and email are already taken!" });
    } else if (errorStatus[0]) {
      return res.status(422).send({ errorMsg: "Username is already taken!" });
    } else if (errorStatus[1]) {
      return res.status(422).send({ errorMsg: "Email is already taken!" });
    } else {
      const update = await User.findOneAndUpdate(
        { _id: req.user[0]._id },
        updateQuery,
        { new: true }
      );

      let formattedUser = update;
      formattedUser.password = undefined;
      return res.status(201).send({ user: formattedUser });
    }
  } else {
    res.sendStatus(404);
  }
});

router.put("/pick_teams", async (req, res) => {
  if (req.user) {
    const update = await User.findOneAndUpdate(
      { _id: req.user[0]._id },
      { favoriteTeams: req.body.teams },
      { new: true }
    );

    res.status(200).send({ status: true });
  } else {
    res.sendStatus(404);
  }
});

module.exports = router;
