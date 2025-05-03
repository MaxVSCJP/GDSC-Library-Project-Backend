const User = require("../Models/UserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;
const csrf = require("../Middlewares/CSRFProtectionMW");
const { body, check, validationResult } = require("express-validator");
const emailer = require("nodemailer");
require("dotenv").config();

const transporter = emailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

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

  body("role")
    .optional()
    .trim()
    .isIn(["vendor", "writer", "admin", "user"])
    .withMessage("Role must be either vendor, writer, or admin"),

  body("BankAccount")
    .trim()
    .isLength({ min: 13, max: 13 })
    .withMessage("Bank account number must be 13 characters long")
    .isNumeric()
    .withMessage("Invalid bank account number"),

  check("profile")
    .optional()
    .custom((value, { req }) => {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/heic",
      ];
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new Error("Only JPG, PNG, WebP, and GIF images are allowed");
      }
      return true;
    })
    .custom((value, { req }) => {
      if (req.file.size > 2 * 1024 * 1024) {
        throw new Error("Image size should not exceed 2MB");
      }
      return true;
    }),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized to add account" });
    }

    const {
      name,
      username,
      email,
      password,
      location,
      phone,
      role,
      BankAccount,
    } = req.body;

    try {
      const hashed = await bcrypt.hash(password, 13);

      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      let profileImage;
      if (req.file) {
        const uploadFromBuffer = (buffer) => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "ProfileImages",
                width: 500,
                crop: "scale",
                quality: "60",
                format: "webp",
                unique_filename: true,
              },
              (error, profileImage) => {
                if (profileImage) {
                  resolve(profileImage);
                } else {
                  reject(error);
                }
              }
            );
            stream.end(buffer);
          });
        };

        profileImage = await uploadFromBuffer(req.file.buffer);
      }

      const newUser = new User({
        name,
        username,
        email,
        password: hashed,
        location,
        phone,
        role,
        BankAccount,
        ProfilePicURL: profileImage ? profileImage.secure_url : null,
        ProfilePicID: profileImage ? profileImage.public_id : null,
      });

      await newUser.save();
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
    .withMessage("Password must be at least 8 characters long"),

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
        {
          userId: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
      });

      res.status(200).json({
        message: "Succesfully logged in ",
        role: user.role,
        ProfilePicURL: user.ProfilePicURL,
      });
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
      path: "/",
    });

    res.status(200).json({ message: "Logged out Succesfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

exports.checkLogStatus = (req, res) => {
  res.status(204).send();
};
