const express = require("express");
const router = express.Router();
const { translate, translateBatch } = require("../controllers/translation");

router.post("/", translate);
router.post("/batch", translateBatch);

module.exports = router;
