const express = require("express");
const router = express.Router();

const {
  getAllJobs,
  getJobById,
  postJob,
  deleteJob,
} = require("../controllers/jobs");

// Get all jobs
router.get("/", getAllJobs);

// Get job by ID
router.get("/:id", getJobById);

// Post a new job
router.post("/", postJob);

// Delete a job (soft delete)
router.delete("/:id", deleteJob);

module.exports = router;