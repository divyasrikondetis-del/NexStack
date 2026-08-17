const crypto = require("crypto");
const Razorpay = require("razorpay");
const Payment = require("../models/Payment");
const Subscription = require("../models/Subscription");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const { SUBSCRIPTION_PLANS, getPlan } = require("../utils/subscriptionPlans");
const { getRazorpayConfigState } = require("../utils/paymentConfig");

const paidPlans = ["bronze", "silver", "gold"];

const getRazorpayClient = () => {
  const config = getRazorpayConfigState();
  if (!config.configured) return null;

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const isLocalTestMode = () => process.env.NODE_ENV !== "production" && !getRazorpayConfigState().configured;

const simulatePayment = async ({ payment, plan, userId, planId, billingDetails }) => {
  const providerPaymentId = `mock_${Date.now()}`;
  const orderId = `mock_order_${payment._id.toString()}`;

  return {
    providerPaymentId,
    orderId,
    signature: "mock-signature",
    billingDetails: {
      name: billingDetails.name || payment.billingDetails?.name || "Demo User",
      email: billingDetails.email || payment.billingDetails?.email || "demo@example.com",
      phone: billingDetails.phone || "",
      address: billingDetails.address || "",
      city: billingDetails.city || "",
      state: billingDetails.state || "",
      country: billingDetails.country || "India",
      postalCode: billingDetails.postalCode || "",
    },
    planId,
    userId,
    amount: plan.price,
    currency: plan.currency,
  };
};

const buildInvoiceNumber = () => `NXS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const isRazorpayConfigured = () => getRazorpayConfigState().configured;

const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  if (!isRazorpayConfigured()) {
    return true;
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  if (!signature || signature.length !== expectedSignature.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
};

const getSubscriptionDashboard = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("name email subscriptionPlan subscriptionStatus premiumBadge");
    if (!user) return res.status(404).json({ message: "User not found" });

    let subscription = await Subscription.findOne({ user: userId });
    if (!subscription) {
      subscription = await Subscription.create({
        user: userId,
        plan: "free",
        status: "active",
        billingDetails: { name: user.name, email: user.email },
      });
    }

    const payments = await Payment.find({ user: userId }).sort({ createdAt: -1 });
    const plan = getPlan(subscription.plan);

    res.json({
      plans: SUBSCRIPTION_PLANS,
      subscription,
      activePlan: plan,
      payments,
      billingDetails: subscription.billingDetails,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCheckout = async (req, res) => {
  try {
    const { userId, planId, provider = "razorpay", billingDetails = {} } = req.body;
    if (!paidPlans.includes(planId)) return res.status(400).json({ message: "Select Bronze, Silver, or Gold to upgrade." });
    if (provider !== "razorpay") return res.status(400).json({ message: "Only Razorpay is supported for premium membership payments." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const plan = getPlan(planId);

    const payment = await Payment.create({
      user: userId,
      plan: planId,
      amount: plan.price,
      currency: plan.currency,
      provider,
      providerOrderId: `razorpay_order_${Date.now()}`,
      billingDetails: { name: user.name, email: user.email, ...billingDetails },
    });

    let razorpayOrder = null;
    const razorpayClient = getRazorpayClient();

    if (isLocalTestMode()) {
      razorpayOrder = {
        id: `mock_order_${payment._id.toString()}`,
      };
    } else {
      razorpayOrder = await razorpayClient.orders.create({
        amount: plan.price * 100,
        currency: "INR",
        receipt: String(payment._id),
        notes: {
          userId: String(userId),
          planId,
          paymentId: String(payment._id),
        },
      });
    }

    payment.providerOrderId = razorpayOrder.id;
    await payment.save();

    res.status(201).json({
      message: "Checkout session created. Confirm payment to activate your subscription.",
      checkout: {
        paymentId: payment._id,
        provider,
        providerOrderId: razorpayOrder.id,
        orderId: razorpayOrder.id,
        amount: plan.price,
        currency: plan.currency,
        razorpayKey: process.env.RAZORPAY_KEY_ID || null,
        plan,
        testMode: isLocalTestMode(),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const { paymentId, providerPaymentId, signature, orderId } = req.body;
    const payment = await Payment.findById(paymentId).populate("user", "name email");
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    if (payment.provider !== "razorpay") return res.status(400).json({ message: "Only Razorpay payments are supported for this subscription flow." });
    if (payment.status === "paid") return res.json({ message: "Payment already confirmed", payment });

    if (!isLocalTestMode() && (!providerPaymentId || !signature || !orderId)) {
      return res.status(400).json({ message: "Razorpay payment confirmation requires providerPaymentId, orderId, and signature." });
    }

    let paymentDetails = {
      providerPaymentId,
      orderId,
      signature,
    };

    if (isLocalTestMode()) {
      paymentDetails = await simulatePayment({
        payment,
        plan: getPlan(payment.plan),
        userId: payment.user._id,
        planId: payment.plan,
        billingDetails: payment.billingDetails || {},
      });
    } else {
      const isSignatureValid = verifyRazorpaySignature({
        orderId,
        paymentId: providerPaymentId,
        signature,
      });

      if (!isSignatureValid) {
        return res.status(400).json({ message: "Razorpay payment verification failed." });
      }
    }

    const plan = getPlan(payment.plan);
    const now = new Date();
    const renewalDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const subscription = await Subscription.findOneAndUpdate(
      { user: payment.user._id },
      {
        plan: payment.plan,
        status: "active",
        provider: payment.provider,
        providerSubscriptionId: paymentDetails.providerPaymentId || payment.providerOrderId,
        questionLimitPerDay: plan.questionLimitPerDay,
        currentPeriodStart: now,
        currentPeriodEnd: renewalDate,
        renewalDate,
        billingDetails: { name: payment.user.name, email: payment.user.email, ...payment.billingDetails },
      },
      { new: true, upsert: true }
    );

    payment.status = "paid";
    payment.subscription = subscription._id;
    payment.providerPaymentId = paymentDetails.providerPaymentId || `${payment.provider}_pay_${Date.now()}`;
    payment.invoice = {
      invoiceNumber: buildInvoiceNumber(),
      issuedAt: now,
      downloadUrl: `/subscriptions/${payment.user._id}/invoices/${payment._id}`,
    };
    payment.billingDetails = paymentDetails.billingDetails;
    await payment.save();

    await User.findByIdAndUpdate(payment.user._id, {
      subscriptionPlan: payment.plan,
      subscriptionStatus: "active",
      premiumBadge: plan.badge,
      subscriptionRenewalDate: renewalDate,
    });

    try {
      await sendEmail(
        payment.user.email,
        `NexStack ${plan.name} subscription activated`,
        `Hi ${payment.user.name},\n\nYour ${plan.name} plan is active.\nInvoice: ${payment.invoice.invoiceNumber}\nAmount: ₹${plan.price}/month\nRenewal date: ${renewalDate.toDateString()}\n\nFeatures:\n- ${plan.features.join("\n- ")}`
      );
    } catch (emailError) {
      console.error("Subscription email could not be sent:", emailError.message);
    }

    res.json({ message: "Payment successful. Subscription activated.", subscription, payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const downloadInvoice = async (req, res) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.paymentId, user: req.params.userId }).populate("user", "name email");
    if (!payment || !payment.invoice) return res.status(404).json({ message: "Invoice not found" });
    const plan = getPlan(payment.plan);
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", `attachment; filename=${payment.invoice.invoiceNumber}.txt`);
    res.send(`NexStack Invoice\nInvoice: ${payment.invoice.invoiceNumber}\nCustomer: ${payment.user.name} <${payment.user.email}>\nPlan: ${plan.name}\nAmount: ₹${payment.amount} ${payment.currency}\nStatus: ${payment.status}\nIssued: ${payment.invoice.issuedAt.toISOString()}\n`);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSubscriptionDashboard, createCheckout, confirmPayment, downloadInvoice };
