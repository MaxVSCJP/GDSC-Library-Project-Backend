const User = require("../Models/UserModel");

const usernameAvailability = async (req, res, next) => {
  const { username, phone, email } = req.body;

  try {
    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { phone }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Email, Username, or Phone Number already in use" });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = usernameAvailability;
