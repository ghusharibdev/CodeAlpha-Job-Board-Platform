const express = require("express");
const { auth } = require("../middlewares/auth");
const { searchJob, applyForJob, uploadResume, getResume, getDashboard, getApplications, getApplicationById, upload } = require("../controllers/candidateController");
const router = express.Router();

router.post('/searchJob', auth, searchJob);
router.post('/applyJob', auth, applyForJob);
router.post('/uploadResume', auth, upload.single('resume'), uploadResume);
router.get('/getResume', auth, getResume);
router.get('/dashboard', auth, getDashboard);
router.get('/applications', auth, getApplications);
router.get('/applications/:id', auth, getApplicationById);

module.exports = router;