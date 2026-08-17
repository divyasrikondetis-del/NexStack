const SUBSCRIPTION_PLANS = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    currency: "INR",
    interval: "month",
    questionLimitPerDay: 1,
    badge: null,
    features: ["1 question per day", "Basic search functionality"],
  },
  bronze: {
    id: "bronze",
    name: "Bronze",
    price: 99,
    currency: "INR",
    interval: "month",
    questionLimitPerDay: 5,
    badge: "Bronze",
    features: ["5 questions per day", "Bronze profile badge", "Advanced search filters"],
  },
  silver: {
    id: "silver",
    name: "Silver",
    price: 299,
    currency: "INR",
    interval: "month",
    questionLimitPerDay: 15,
    badge: "Silver",
    features: [
      "15 questions per day",
      "Silver profile badge",
      "Priority support",
      "Enhanced profile visibility",
      "Unlimited bookmarks",
    ],
  },
  gold: {
    id: "gold",
    name: "Gold",
    price: 999,
    currency: "INR",
    interval: "month",
    questionLimitPerDay: -1,
    badge: "Gold",
    features: [
      "Unlimited question posting",
      "Gold profile badge",
      "Highest search priority",
      "Featured profile visibility",
      "Priority customer support",
      "Exclusive community features",
    ],
  },
};

const getPlan = (planId = "free") => SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.free;

module.exports = { SUBSCRIPTION_PLANS, getPlan };
