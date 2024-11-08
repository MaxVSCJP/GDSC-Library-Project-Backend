const express = require("express");
const router = express.Router();
const authController = require("../Controllers/AuthControllers");
const usernameAvailabilityMW = require("../Middlewares/UsernameAvailabilityMW");
const authMW = require("../Middlewares/AuthorizationMW");
const csrf = require("../Middlewares/CSRFProtectionMW");

router.post("/login", authController.Login);
router.post("/signup", usernameAvailabilityMW, authController.Signup);
router.post("/logout", authMW(), csrf.csrfProtection, authController.Logout);

module.exports = router;
