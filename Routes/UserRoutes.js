const express = require("express");
const router = express.Router();
const UserController = require("../Controllers/UserControllers");
const authMW = require("../Middlewares/AuthorizationMW");
const usernameAvailabilityMW = require("../Middlewares/UsernameAvailabilityMW");
const morgan = require("morgan");
const morganLogs = require("../Middlewares/MorganLogs");

router.get("/GetUser", authMW(), UserController.GetUser);
router.patch(
  "/EditUser",
  authMW(),
  usernameAvailabilityMW,
  morgan(morganLogs.logFormat, { stream: morganLogs.stream }),
  UserController.EditUser
);
router.delete(
  "/DeleteUser",
  authMW(),
  morgan(morganLogs.logFormat, { stream: morganLogs.stream }),
  UserController.DeleteUser
);

module.exports = router;
