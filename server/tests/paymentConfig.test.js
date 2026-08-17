const test = require("node:test");
const assert = require("node:assert/strict");
const { getRazorpayConfigState } = require("../utils/paymentConfig");

test("detects a fully configured Razorpay setup", () => {
  const env = {
    RAZORPAY_KEY_ID: "rzp_test_123",
    RAZORPAY_KEY_SECRET: "secret_123",
    RAZORPAY_MODE: "live",
  };

  assert.deepStrictEqual(getRazorpayConfigState(env), {
    configured: true,
    mode: "live",
    allowCheckout: true,
  });
});

test("rejects checkout when Razorpay credentials are missing", () => {
  const env = {
    RAZORPAY_MODE: "live",
  };

  assert.deepStrictEqual(getRazorpayConfigState(env), {
    configured: false,
    mode: "live",
    allowCheckout: false,
  });
});
