const express = require("express");
const multer = require("multer");
const router = express.Router();
const BookController = require("../Controllers/BookControllers");
const authMW = require("../Middlewares/AuthorizationMW");
const csrf = require("../Middlewares/CSRFProtectionMW");
const morgan = require("morgan");
const morganLogs = require("../Middlewares/MorganLogs");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  "/AddBook",
  authMW(),
  csrf.csrfProtection,
  morgan(morganLogs.logFormat, { stream: morganLogs.stream }),
  upload.single("image"),
  BookController.AddBook
);
router.get(
  "/SearchBook/:name",
  authMW(),
  csrf.csrfProtection,
  morgan(morganLogs.logFormat, { stream: morganLogs.stream }),
  BookController.SearchBook
);
router.patch(
  "/EditBook/:id",
  authMW(),
  csrf.csrfProtection,
  morgan(morganLogs.logFormat, { stream: morganLogs.stream }),
  upload.single("image"),
  BookController.EditBook
);
router.delete(
  "/DeleteBook/:bookId",
  authMW(),
  csrf.csrfProtection,
  morgan(morganLogs.logFormat, { stream: morganLogs.stream }),
  BookController.DeleteBook
);

module.exports = router;
