const express = require("express");
const router = express.Router();
const {
  getSubscriptionDashboard,
  createCheckout,
  confirmPayment,
  downloadInvoice,
} = require("../controllers/subscriptions");

router.get("/:userId", getSubscriptionDashboard);
router.post("/checkout", createCheckout);
router.post("/confirm", confirmPayment);
router.get("/:userId/invoices/:paymentId", downloadInvoice);

module.exports = router;
