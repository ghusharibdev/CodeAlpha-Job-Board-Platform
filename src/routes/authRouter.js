const express = require("express");
const { signup, login, logout } = require("../controllers/authController");
const router = express.Router();
const passport = require('passport')

router.post("/signup", signup);
router.post("/login", passport.authenticate("local"), login);
router.post("/logout", logout);

module.exports = router;
