const mongoose = require("mongoose");
const employerSchema = mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,
    employerName: { type: String, required: true },
    employerContact: Number,
    employerMail: String,
    companyName: String,
    companyAddress: String,
    jobsListed: [
      {
        jobId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'JobListing'
        }
      }
    ],
    applications: [
      {
        applicationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Application'
        }
      }
    ]
  },
  { timestamps: true }
);

const Employer = new mongoose.model("Employer", employerSchema);
module.exports = Employer;
