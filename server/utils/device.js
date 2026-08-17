const crypto = require("crypto");

const parseUserAgent = (userAgent = "") => {
  const normalized = userAgent.toLowerCase();

  let browser = "Unknown";
  let os = "Unknown";
  let deviceType = "Desktop";

  if (/mobile|android|iphone|ipad|ipod/i.test(normalized)) {
    deviceType = "Mobile";
  } else if (/tablet|ipad/i.test(normalized)) {
    deviceType = "Tablet";
  }

  if (/windows/i.test(normalized)) {
    os = "Windows";
  } else if (/mac os/i.test(normalized)) {
    os = "macOS";
  } else if (/android/i.test(normalized)) {
    os = "Android";
  } else if (/iphone|ipad|ipod/i.test(normalized)) {
    os = "iOS";
  } else if (/linux/i.test(normalized)) {
    os = "Linux";
  }

  if (/edg|edge/i.test(normalized)) {
    browser = "Edge";
  } else if (/chrome/i.test(normalized)) {
    browser = "Chrome";
  } else if (/firefox/i.test(normalized)) {
    browser = "Firefox";
  } else if (/safari/i.test(normalized)) {
    browser = "Safari";
  }

  return { browser, os, deviceType };
};

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }

  return req.socket?.remoteAddress || req.ip || "Unknown";
};

const getDeviceFingerprint = (userAgent = "", ipAddress = "") => {
  return crypto
    .createHash("sha256")
    .update(`${userAgent}:${ipAddress}`)
    .digest("hex");
};

const getLocationLabel = (req) => {
  const city = req.headers["x-city"] || "";
  const country = req.headers["x-country"] || "";
  const region = req.headers["x-region"] || "";

  if (city || country || region) {
    return [city, region, country].filter(Boolean).join(", ");
  }

  return "Unknown";
};

module.exports = {
  parseUserAgent,
  getClientIp,
  getDeviceFingerprint,
  getLocationLabel,
};
