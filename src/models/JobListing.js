const mongoose = require("mongoose");
const jobSchema = mongoose.Schema({
  jobTitle: String,
  jobDescription: String,
  experience: {
    type: String,
    enum: ["entry", "intermediate", "experienced"],
  },
  salary: Number,
  offeredBy: {
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
    },
  },
  role: String,
  
});

const JobListing = new mongoose.model("JobListing", jobSchema);
module.exports = JobListing;
