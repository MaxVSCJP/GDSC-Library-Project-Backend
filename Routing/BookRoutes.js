const express = require("express");
const router = express.Router();
const BookController = require("../Controllers/BookControllers");
const authMW = require("../Middlewares/AuthorizationMW");


router.post("/AddBook", authMW(), BookController.AddBook);
router.get("/SearchBook/:name", authMW(), BookController.SearchBook);
router.patch("/EditBook/:id", authMW(), BookController.EditBook);
router.delete("/DeleteBook", authMW(), BookController.DeleteBook);


module.exports = router;

