const { hashPass } = require("../auth/encryption");
const Candidate = require("../models/Candidate");
const Employer = require("../models/Employer");
const User = require("../models/User");

const signup = async (req, res) => {
  const { username, password, userType, name } = req.body;
  const hashed = hashPass(password);

  const findUser = await User.findOne({ username });
  if (findUser) {
    return res.status(409).json({ message: "User already signed up!" });
  }

  const newUser = await User.create({ username, password: hashed, userType });
  if (!newUser) {
    return res.status(400).send("Failed to signup!");
  }

  if (userType === "Employer") {
    (await Employer.create({
      userId: newUser._id,
      employerName: name,
    }))
      ? res.send("Sign up successfull!")
      : res.status(400).json({ message: "Employer name is required!" });
  } else if (userType === "Candidate") {
    (await Candidate.create({
      userId: newUser._id,
      candidateName: name,
    }))
      ? res.send("Sign up successfull!")
      : res.status(400).json({ message: "Candidate Name is required!" });
  }
};

const login = (req, res) => {
  res.send("Logged In!");
};

const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Error during logout" });
    }
    res.json({ message: "Logged out successfully!" });
  });
};

module.exports = {
  signup,
  login,
  logout
};
