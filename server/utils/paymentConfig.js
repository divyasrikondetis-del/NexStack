const getRazorpayConfigState = (env = process.env) => {
  const hasKeyId = Boolean(env.RAZORPAY_KEY_ID);
  const hasKeySecret = Boolean(env.RAZORPAY_KEY_SECRET);
  const configured = hasKeyId && hasKeySecret;
  const mode = env.RAZORPAY_MODE || (configured ? "live" : "test");

  return {
    configured,
    mode,
    allowCheckout: configured,
  };
};

module.exports = {
  getRazorpayConfigState,
};
