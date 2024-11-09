const User = require("../Models/UserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const csrf = require("../Middlewares/CSRFProtectionMW");
const { body, validationResult } = require("express-validator");
require("dotenv").config();

exports.Signup = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters long"),

  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 4 })
    .withMessage("Username must be at least 4 characters long"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),

  body("location")
    .trim()
    .isLength({ max: 100 })
    .withMessage("Location must be less than 100 characters"),

  body("phone")
    .matches(/^\+?[0-9\s\-\(\)]+$/)
    .withMessage("Invalid phone number")
    .isLength({ min: 9, max: 15 })
    .withMessage("Phone number must be between 9 and 15 characters long"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, username, email, password, location, phone } = req.body;

    try {
      const existingUser = await User.findOne({
        $or: [{ email }, { username }, { phone }],
      });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Email, Username, or Phone Number already in use" });
      }

      const hashed = await bcrypt.hash(password, 13);

      const newUser = new User({
        name,
        username,
        email,
        password: hashed,
        location,
        phone,
      });

      await newUser.save();

      res.status(201).json({ message: "User Created Successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: error.message });
    }
  },
];

exports.Login = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 4 })
    .withMessage("Username must be at least 4 characters long"),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 6 characters long"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
      const user = await User.findOne({ username });
      if (!user) return res.status(404).json({ error: "User not found" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(403).json({ error: "Wrong Password" });

      const token = jwt.sign(
        { userId: user._id, username: user.username, email: user.email },
        process.env.JWT_SECRET
      );

      const csrfToken = csrf.generateToken(req, res, false, false);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 100,
      });

      res.cookie("csrfToken", csrfToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        path: "/",
        maxAge: 1000 * 60 * 60 * 24 * 100,
      });

      res.status(200).json({ message: "Succesfully logged in " });
    } catch (error) {
      res.status(500).json({ error: error.message });
      console.log(error);
    }
  },
];

exports.Logout = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
    });
    console.log("token cleared");

    res.clearCookie("csrfCookie", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      path: "/",
    });
    console.log("csrftoken cleared");

    res.status(200).json({ message: "Logged out Succesfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

exports.checkLogStatus = (req, res) => {
  res.status(204).send();
};
