const router = require("express").Router();
const auth = require("../middleware/auth");
const { requireAdmin } = require("../middleware/accountStatus");
const { getDashboard, getReports, reviewReport, getSecurityLogs } = require("../controllers/admin");

router.get("/dashboard", auth, requireAdmin, getDashboard);
router.get("/reports", auth, requireAdmin, getReports);
router.get("/security-logs", auth, requireAdmin, getSecurityLogs);
router.patch("/reports/:postId", auth, requireAdmin, reviewReport);

module.exports = router;
