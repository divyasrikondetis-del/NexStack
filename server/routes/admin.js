const router = require("express").Router();
const { requireAdmin } = require("../middleware/accountStatus");
const { getDashboard, getReports, reviewReport } = require("../controllers/admin");

router.get("/dashboard", requireAdmin, getDashboard);
router.get("/reports", requireAdmin, getReports);
router.patch("/reports/:postId", requireAdmin, reviewReport);

module.exports = router;
