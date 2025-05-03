const express = require("express");
const router = express.Router();
const SearchController = require("../Controllers/SearchController");
const morgan = require("morgan");
const morganLogs = require("../Middlewares/MorganLogs");

router.get(
  "/book/:name",
  morgan(morganLogs.logFormat, { stream: morganLogs.stream }),
  SearchController.SearchBook
);
router.get(
  "/owner/:id",
  morgan(morganLogs.logFormat, { stream: morganLogs.stream }),
  SearchController.SearchOwner
);
router.get(
  "/books",
  morgan(morganLogs.logFormat, { stream: morganLogs.stream }),
  SearchController.GetAllBooks
);

module.exports = router;
