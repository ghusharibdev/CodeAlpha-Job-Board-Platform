const mongoose = require("mongoose");
const applicationSchema = mongoose.Schema({
  from: {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
    },
  },
  to: {
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employer",
    },
  },
  forJob: {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobListing",
    },
  },
  status: {
    type: String,
    enum: ["pending", "rejected", "accepted"],
    default: "pending",
  },
});

const Application = new mongoose.model("Application", applicationSchema);
module.exports = Application;
