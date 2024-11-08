const express = require("express");
const multer = require("multer");
const router = express.Router();
const BookController = require("../Controllers/BookControllers");
const authMW = require("../Middlewares/AuthorizationMW");
const csrf = require("../Middlewares/CSRFProtectionMW");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  "/AddBook",
  authMW(),
  csrf.csrfProtection,
  upload.single("image"),
  BookController.AddBook
);
router.get("/SearchBook/:name", authMW(), BookController.SearchBook);
router.patch(
  "/EditBook/:id",
  authMW(),
  csrf.csrfProtection,
  upload.single("image"),
  BookController.EditBook
);
router.delete(
  "/DeleteBook",
  authMW(),
  csrf.csrfProtection,
  BookController.DeleteBook
);

module.exports = router;
