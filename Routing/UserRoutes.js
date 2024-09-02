const express = require("express");
const router = express.Router();
const UserController = require("../Controllers/UserControllers");
const authMW = require("../Middlewares/AuthorizationMW");


router.patch("/EditUser", authMW(), UserController.EditUser);
router.delete("/DeleteUser", authMW(), UserController.DeleteUser);


module.exports = router;

