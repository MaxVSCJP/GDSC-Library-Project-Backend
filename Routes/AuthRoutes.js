const express = require("express");
const router = express.Router();
const multer = require("multer");
const authController = require("../Controllers/AuthControllers");
const usernameAvailabilityMW = require("../Middlewares/UsernameAvailabilityMW");
const authMW = require("../Middlewares/AuthorizationMW");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/login", upload.single(), authController.Login);
router.post(
  "/signup",
  authMW(),
  usernameAvailabilityMW,
  upload.single("profile"),
  authController.Signup
);
router.post("/logout", authMW(), authController.Logout);
router.get("/check", authMW(), authController.checkLogStatus);

module.exports = router;
