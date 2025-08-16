const nodemailer = require("nodemailer");
require("dotenv").config();

const notifyEmployer = async (employer, jobApplication) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "ghusharibnajam@gmail.com",
      pass: process.env.MAILER_PASSWORD,
    },
  });

  const mailOptions = {
    from: "ghusharibnajam@gmail.com",
    to: employer.employerMail,
    subject: "New Application recieved!",
    text: `You have recieved a new application for job listing: ${jobApplication}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const notifyCandidate = async (candidate, jobApplication) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "ghusharibnajam@gmail.com",
      pass: process.env.MAILER_PASSWORD,
    },
  });

  const mailOptions = {
    from: "ghusharibnajam@gmail.com",
    to: candidate.candidateMail,
    subject: "Application Status Updated",
    text: `Your job application status has been updated: ${jobApplication}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = {
  notifyEmployer,
  notifyCandidate,
};
