const express = require("express");
const router = express.Router();
const SearchController = require("../Controllers/SearchController");


router.get("/:name", SearchController.SearchBook);



module.exports = router;

