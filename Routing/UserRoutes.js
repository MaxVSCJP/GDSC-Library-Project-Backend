const express = require("express");
const router = express.Router();
const UserController = require("../Controllers/UserControllers");
const authMW = require("../Middlewares/AuthorizationMW");
const csrf = require("../Middlewares/CSRFProtectionMW");

router.get("/GetUser", authMW(), csrf.csrfProtection, UserController.GetUser);
router.patch(
  "/EditUser",
  authMW(),
  csrf.csrfProtection,
  UserController.EditUser
);
router.delete(
  "/DeleteUser",
  authMW(),
  csrf.csrfProtection,
  UserController.DeleteUser
);

module.exports = router;
