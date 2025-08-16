const mongoose = require("mongoose");
const candidateSchema = mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  candidateName: { type: String, required: true },
  candidateContact: Number,
  candidateMail: String,
  description: String,
  resumeLink: String,
  skills: [String],
  workHistory: [
    {
      company: String,
      title: String,
      from: Date,
      to: Date,
    },
  ],
});

const Candidate = new mongoose.model("Candidate", candidateSchema);
module.exports = Candidate;
