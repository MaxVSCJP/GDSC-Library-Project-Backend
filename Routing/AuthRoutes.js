const express = require('express');
const router = express.Router();
const authController = require('../Controllers/AuthControllers');
const usernameAvailabilityMW = require('../Middlewares/UsernameAvailabilityMW');


router.post('/login', authController.login);
router.post("/signup", usernameAvailabilityMW, authController.signup);

module.exports = router;