const express = require("express");
const session = require("express-session");
const app = express();
require("dotenv").config();
const employerRouter = require("./src/routes/employerRoutes");
const PORT = process.env.PORT;
const mongoose = require("mongoose");
const passport = require("passport");
require("./src/auth/local-strategy");
const authRoute = require("./src/routes/authRouter");
const MongoStore = require("connect-mongo");
const candidateRouter = require("./src/routes/candidateRoutes")

;(async () => {
  mongoose.connect(
    `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@cluster0.y3gibzq.mongodb.net/`
  )
    ? console.log("DB Connected!")
    : console.log("Failed to connect DB");

  app.use(express.json());
  app.use('/uploads', express.static('uploads'));

  app.use(
    session({
      secret: process.env.SESS_SECRET,
      saveUninitialized: false,
      resave: false,
      cookie: { maxAge: 1000 * 60 * 60 },
      store: MongoStore.create({
        client: mongoose.connection.getClient(),
      }),
    })
  );
  app.use(passport.initialize(), passport.session());
  app.use(authRoute);
  app.use(employerRouter, candidateRouter);

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
