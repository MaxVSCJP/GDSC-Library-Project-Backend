const express = require("express");
const multer = require("multer");
const router = express.Router();
const BookController = require("../Controllers/BookControllers");
const authMW = require("../Middlewares/AuthorizationMW");
const morgan = require("morgan");
const morganLogs = require("../Middlewares/MorganLogs");

const storage = multer.memoryStorage();
const upload = multer({ storage });

const fileFields = [
  { name: "image", maxCount: 1 },
  { name: "BookPDF", maxCount: 1 },
];

router.post(
  "/AddBook",
  authMW(),
  morgan(morganLogs.logFormat, { stream: morganLogs.stream }),
  upload.fields(fileFields),
  BookController.AddBook
);
router.get(
  "/SearchBook/:name",
  authMW(),
  morgan(morganLogs.logFormat, { stream: morganLogs.stream }),
  BookController.SearchBook
);
router.patch(
  "/EditBook/:id",
  authMW(),
  morgan(morganLogs.logFormat, { stream: morganLogs.stream }),
  upload.single(fileFields),
  BookController.EditBook
);
router.delete(
  "/DeleteBook/:bookId",
  authMW(),
  morgan(morganLogs.logFormat, { stream: morganLogs.stream }),
  BookController.DeleteBook
);

module.exports = router;
