const { notifyCandidate } = require("../middlewares/notify");
const Application = require("../models/Application");
const Candidate = require("../models/Candidate");
const Employer = require("../models/Employer");
const JobListing = require("../models/JobListing");

const updateDetails = async (req, res) => {
  const {
    employerName,
    employerContact,
    employerMail,
    companyName,
    companyAddress,
    jobsListed,
  } = req.body;
  const employer = await Employer.findOne({ userId: req.user._id });

  const updatedEmployee = await Employer.findOneAndUpdate(
    { _id: employer._id },
    {
      employerName,
      employerContact,
      employerMail,
      companyName,
      companyAddress,
      $addToSet: {
        jobsListed: {
          $each: jobsListed.map((jobId) => ({ jobId })),
        },
      },
    }
  );
  if (!updatedEmployee) return res.status(400).json({ message: "Failed!" });
  res.json({ message: "Employer updated successfully!" });
};

const jobPost = async (req, res) => {
  if (!req.user) {
    return res.status(401).send("Login required!");
  }

  if (req.user.userType !== "Employer") {
    return res.status(403).send("Only employers can post jobs!");
  }

  const { jobTitle, jobDescription, experience, salary, role } = req.body;
  const employer = await Employer.findOne({ userId: req.user._id });

  const savedJob = await JobListing.create({
    jobTitle,
    jobDescription,
    experience,
    salary,
    offeredBy: { employerId: employer._id },
    role,
  });

  if (!savedJob) return res.status(400).send("Couldn't post job!");
  res.send("Job posted successfully!");
};

const updateApplicationStatus = async (req, res) => {
  const { applicationId, status } = req.body;
  const findApplicationEmployer = await Employer.findOne({
    "applications.applicationId": applicationId,
  });
  if (!findApplicationEmployer)
    return res
      .status(404)
      .json({ message: "No such application for this employer" });

  const findApplication = await Application.findOneAndUpdate(
    { _id: applicationId },
    { status }
  );

  if (!findApplication)
    return res
      .status(400)
      .json({ message: "Couldn't update application status!" });

  const candidate = await Candidate.findOne({
    _id: findApplication.from.candidateId,
  });

  notifyCandidate(candidate, findApplication);

  res.json({
    message: "Status updated successfully!",
    updatedApplication: findApplication,
  });
};

const getDashboard = async (req, res) => {
  try {
    if (req.user.userType !== "Employer") {
      return res.status(403).json({ message: "Only employers can access dashboard!" });
    }

    const employer = await Employer.findOne({ userId: req.user._id });
    if (!employer) {
      return res.status(404).json({ message: "Employer profile not found!" });
    }

    const jobs = await JobListing.find({ "offeredBy.employerId": employer._id });
    const totalJobs = jobs.length;

    const applications = await Application.find({ "to.employerId": employer._id })
      .populate('from.candidateId')
      .populate('forJob.jobId')
      .sort({ createdAt: -1 });

    const totalApplications = applications.length;
    const pendingApplications = applications.filter(app => app.status === 'pending').length;
    const acceptedApplications = applications.filter(app => app.status === 'accepted').length;
    const rejectedApplications = applications.filter(app => app.status === 'rejected').length;

    const recentApplications = applications.slice(0, 5);

    res.json({
      employer: {
        name: employer.employerName,
        company: employer.companyName,
        email: employer.employerMail
      },
      statistics: {
        totalJobs,
        totalApplications,
        pendingApplications,
        acceptedApplications,
        rejectedApplications
      },
      recentApplications,
      jobs
    });
  } catch (error) {
    console.error("Error getting dashboard:", error);
    res.status(500).json({ message: "Error retrieving dashboard!" });
  }
};

const getJobs = async (req, res) => {
  try {
    if (req.user.userType !== "Employer") {
      return res.status(403).json({ message: "Only employers can view jobs!" });
    }

    const employer = await Employer.findOne({ userId: req.user._id });
    if (!employer) {
      return res.status(404).json({ message: "Employer profile not found!" });
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const jobs = await JobListing.find({ "offeredBy.employerId": employer._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await JobListing.countDocuments({ "offeredBy.employerId": employer._id });

    res.json({
      jobs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalJobs: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error("Error getting jobs:", error);
    res.status(500).json({ message: "Error retrieving jobs!" });
  }
};

const getApplications = async (req, res) => {
  try {
    if (req.user.userType !== "Employer") {
      return res.status(403).json({ message: "Only employers can view applications!" });
    }

    const employer = await Employer.findOne({ userId: req.user._id });
    if (!employer) {
      return res.status(404).json({ message: "Employer profile not found!" });
    }

    const { status, jobId, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { "to.employerId": employer._id };
    if (status) {
      query.status = status;
    }
    if (jobId) {
      query["forJob.jobId"] = jobId;
    }

    const applications = await Application.find(query)
      .populate('from.candidateId')
      .populate('forJob.jobId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(query);

    res.json({
      applications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalApplications: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error("Error getting applications:", error);
    res.status(500).json({ message: "Error retrieving applications!" });
  }
};

const getApplicationsByJob = async (req, res) => {
  try {
    if (req.user.userType !== "Employer") {
      return res.status(403).json({ message: "Only employers can view applications!" });
    }

    const { jobId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const employer = await Employer.findOne({ userId: req.user._id });
    if (!employer) {
      return res.status(404).json({ message: "Employer profile not found!" });
    }

    const job = await JobListing.findOne({
      _id: jobId,
      "offeredBy.employerId": employer._id
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found!" });
    }

    let query = { 
      "to.employerId": employer._id,
      "forJob.jobId": jobId
    };
    if (status) {
      query.status = status;
    }

    const applications = await Application.find(query)
      .populate('from.candidateId')
      .populate('forJob.jobId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(query);

    res.json({
      job,
      applications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalApplications: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error("Error getting applications by job:", error);
    res.status(500).json({ message: "Error retrieving applications!" });
  }
};

module.exports = {
  jobPost,
  updateDetails,
  updateApplicationStatus,
  getDashboard,
  getJobs,
  getApplications,
  getApplicationsByJob
};
