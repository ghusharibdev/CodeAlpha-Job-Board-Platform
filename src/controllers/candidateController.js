const { notifyEmployer } = require("../middlewares/notify");
const Application = require("../models/Application");
const Candidate = require("../models/Candidate");
const Employer = require("../models/Employer");
const JobListing = require("../models/JobListing");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/resumes/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const searchJob = async (req, res) => {
  const { search, experience, salary } = req.body;
  if (req.user.userType != "Candidate") {
    return res
      .status(409)
      .json({ message: "Login as candidate to search for job!" });
  }
  const jobs = await JobListing.find({
    ...(search
      ? {
          $or: [
            { jobTitle: { $regex: search, $options: "i" } },
            { jobDescription: { $regex: search, $options: "i" } },
          ],
        }
      : {}),
    ...(experience ? { experience } : {}),
    ...(salary ? { salary: { $gte: Number(salary) } } : {}),
  });

  if (!jobs || jobs.length === 0)
    return res.status(404).json({ message: "No job found!" });
  res.json(jobs);
};

const applyForJob = async (req, res) => {
  const { jobId } = req.body;
  if (req.user.userType != "Candidate") {
    return res
      .status(409)
      .json({ message: "Login as candidate to apply for job!" });
  }

  const candidate = await Candidate.findOne({ userId: req.user._id });
  const employer = await Employer.findOne({ "jobsListed.jobId": jobId });

  const newApplication = await Application.create({
    from: { candidateId: candidate._id },
    to: { employerId: employer._id },
    forJob: { jobId },
  });

  if (!newApplication)
    return res.status(500).json({ message: "Couldn't apply!" });

  notifyEmployer(employer, newApplication);

  employer.applications.push({ applicationId: newApplication._id });
  await employer.save();

  res.json({ message: "Applied for job!", application: newApplication });
};

const uploadResume = async (req, res) => {
  try {
    if (req.user.userType !== "Candidate") {
      return res.status(403).json({ message: "Only candidates can upload resumes!" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded!" });
    }

    const candidate = await Candidate.findOne({ userId: req.user._id });
    if (!candidate) {
      return res.status(404).json({ message: "Candidate profile not found!" });
    }

    candidate.resumeLink = req.file.path;
    await candidate.save();

    res.json({ 
      message: "Resume uploaded successfully!", 
      resumePath: req.file.path,
      filename: req.file.filename
    });
  } catch (error) {
    console.error("Error uploading resume:", error);
    res.status(500).json({ message: "Error uploading resume!" });
  }
};

const getResume = async (req, res) => {
  try {
    if (req.user.userType !== "Candidate") {
      return res.status(403).json({ message: "Only candidates can access their resume!" });
    }

    const candidate = await Candidate.findOne({ userId: req.user._id });
    if (!candidate) {
      return res.status(404).json({ message: "Candidate profile not found!" });
    }

    if (!candidate.resumeLink) {
      return res.status(404).json({ message: "No resume uploaded yet!" });
    }

    res.json({ 
      resumeLink: candidate.resumeLink,
      resumeUrl: `http://localhost:${process.env.PORT}/${candidate.resumeLink}`
    });
  } catch (error) {
    console.error("Error getting resume:", error);
    res.status(500).json({ message: "Error retrieving resume!" });
  }
};

const getDashboard = async (req, res) => {
  try {
    if (req.user.userType !== "Candidate") {
      return res.status(403).json({ message: "Only candidates can access dashboard!" });
    }

    const candidate = await Candidate.findOne({ userId: req.user._id });
    if (!candidate) {
      return res.status(404).json({ message: "Candidate profile not found!" });
    }

    const applications = await Application.find({ "from.candidateId": candidate._id })
      .populate('forJob.jobId')
      .populate('to.employerId')
      .sort({ createdAt: -1 });

    const totalApplications = applications.length;
    const pendingApplications = applications.filter(app => app.status === 'pending').length;
    const acceptedApplications = applications.filter(app => app.status === 'accepted').length;
    const rejectedApplications = applications.filter(app => app.status === 'rejected').length;

    const recentApplications = applications.slice(0, 5);

    res.json({
      candidate: {
        name: candidate.candidateName,
        email: candidate.candidateMail,
        hasResume: !!candidate.resumeLink
      },
      statistics: {
        totalApplications,
        pendingApplications,
        acceptedApplications,
        rejectedApplications
      },
      recentApplications,
      applications
    });
  } catch (error) {
    console.error("Error getting dashboard:", error);
    res.status(500).json({ message: "Error retrieving dashboard!" });
  }
};

const getApplications = async (req, res) => {
  try {
    if (req.user.userType !== "Candidate") {
      return res.status(403).json({ message: "Only candidates can view applications!" });
    }

    const candidate = await Candidate.findOne({ userId: req.user._id });
    if (!candidate) {
      return res.status(404).json({ message: "Candidate profile not found!" });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { "from.candidateId": candidate._id };
    if (status) {
      query.status = status;
    }

    const applications = await Application.find(query)
      .populate('forJob.jobId')
      .populate('to.employerId')
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

const getApplicationById = async (req, res) => {
  try {
    if (req.user.userType !== "Candidate") {
      return res.status(403).json({ message: "Only candidates can view applications!" });
    }

    const { id } = req.params;
    const candidate = await Candidate.findOne({ userId: req.user._id });
    if (!candidate) {
      return res.status(404).json({ message: "Candidate profile not found!" });
    }

    const application = await Application.findOne({
      _id: id,
      "from.candidateId": candidate._id
    })
    .populate('forJob.jobId')
    .populate('to.employerId');

    if (!application) {
      return res.status(404).json({ message: "Application not found!" });
    }

    res.json({ application });
  } catch (error) {
    console.error("Error getting application:", error);
    res.status(500).json({ message: "Error retrieving application!" });
  }
};

module.exports = {
  searchJob,
  applyForJob,
  uploadResume,
  getResume,
  getDashboard,
  getApplications,
  getApplicationById,
  upload
};
