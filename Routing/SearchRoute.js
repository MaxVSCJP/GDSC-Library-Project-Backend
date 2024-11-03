const express = require("express");
const router = express.Router();
const SearchController = require("../Controllers/SearchController");

router.get("/book/:name", SearchController.SearchBook);
router.get("/owner/:id", SearchController.SearchOwner);

module.exports = router;
