const User = require("../models/User");
const ReputationHistory = require("../models/ReputationHistory");

const updateReputation = async (
  userId,
  points,
  action,
  reason = "",
  sender = null,
  receiver = null
) => {
  const user = await User.findById(userId);

  if (!user) return;

  user.reputation += points;

  if (user.reputation < 0) {
    user.reputation = 0;
  }

  await user.save();

  await ReputationHistory.create({
    user: user._id,
    action,
    points,
    reason,
    sender,
    receiver,
  });
};

module.exports = updateReputation;