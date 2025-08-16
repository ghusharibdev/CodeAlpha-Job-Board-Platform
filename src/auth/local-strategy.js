const passport = require("passport");
const { Strategy } = require("passport-local");
const User = require("../models/User");
const { comparePass } = require("./encryption");

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (userId, done) => {
  try {
    const finduser = await User.findById(userId);
    if (!finduser) return done(null, false);
    done(null, finduser);
  } catch (err) {
    done(err, null);
  }
});

passport.use(
  new Strategy(async (username, password, done) => {
    try {
      const findUser = await User.findOne({ username });
      if (!findUser) return done(null, false, {message: "User not found!"})
      if (!comparePass(password, findUser.password))
        return done(null, false, {message: "Wrong credentials!"})
      done(null, findUser);
    } catch (error) {
      console.log(error.message);
      done(error, null);
    }
  })
);
