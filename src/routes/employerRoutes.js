const express = require("express");
const router = express.Router();

const { jobPost, updateDetails, updateApplicationStatus, getDashboard, getJobs, getApplications, getApplicationsByJob } = require("../controllers/employerController");
const { auth } = require("../middlewares/auth");

router.post("/postJob", auth, jobPost);
router.post("/employerUpdateDetails", auth, updateDetails);
router.post('/updateStatus', auth, updateApplicationStatus);
router.get('/dashboard', auth, getDashboard);
router.get('/jobs', auth, getJobs);
router.get('/applications', auth, getApplications);
router.get('/applications/job/:jobId', auth, getApplicationsByJob);

module.exports = router;
