const { query, param, check, validationResult } = require("express-validator");
const Books = require("../Models/BookModel");
const User = require("../Models/UserModel");

exports.SearchBook = [
  param("name")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Book name cannot be empty")
    .matches(/^[a-zA-Z0-9\s+]+$/)
    .withMessage("Invalid book name"),

  query("searchType")
    .optional()
    .isString()
    .isIn(["all", "writer"])
    .withMessage("Invalid search type. Must be either 'all' or 'writer'"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const name = req.params.name;
    const searchType = req.query.searchType || "all";

    try {
      let books;
      searchType === "all"
        ? (books = await Books.find({
            $or: [
              { Title: { $regex: `.*${name}.*`, $options: "i" } },
              { Genre: { $regex: `.*${name}.*`, $options: "i" } },
              { Author: { $regex: `.*${name}.*`, $options: "i" } },
            ],
          }).select(
            "Title Author PublishYear Genre Quantity Description Price BookType BookPDFURL BookImageURL owner"
          ))
        : (books = await Books.find({
            $and: [
              { BookFrom: "writer" },
              {
                $or: [
                  { Title: { $regex: `.*${name}.*`, $options: "i" } },
                  { Genre: { $regex: `.*${name}.*`, $options: "i" } },
                  { Author: { $regex: `.*${name}.*`, $options: "i" } },
                ],
              },
            ],
          }).select(
            "Title Author PublishYear Genre Quantity Description Price BookType BookPDFURL BookImageURL owner"
          ));

      if (!books.length) {
        return res
          .status(404)
          .json({ Status: "Failed", message: "No books found" });
      }

      console.log(books);

      res.status(200).json({
        Status: "Successful",
        books,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ Status: "Failed", message: err.message });
    }
  },
];

exports.SearchOwner = [
  param("id")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Book ID cannot be empty")
    .matches(/^[a-fA-F0-9]{24}$/)
    .withMessage("Invalid book id"),
  query("searchType")
    .optional()
    .isString()
    .isIn(["all", "writer"])
    .withMessage("Invalid search type. Must be either 'all' or 'writer'"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const id = req.params.id;

    try {
      const owner = await User.findById(id).select(
        "username email ProfilePicURL"
      );

      if (!owner) {
        return res
          .status(404)
          .json({ Status: "Failed", message: "No Owner found with such id" });
      }

      res.status(200).json({
        Status: "Successful",
        owner,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ Status: "Failed", message: err.message });
    }
  },
];

exports.GetAllBooks = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Limit must be a positive integer"),
  query("searchType")
    .optional()
    .isString()
    .isIn(["all", "writer"])
    .withMessage("Invalid search type. Must be either 'all' or 'writer'"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const searchType = req.query.searchType || "all";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
      let books;
      searchType == "all"
        ? (books = await Books.find()
            .skip(skip)
            .limit(limit)
            .select(
              "Title Author PublishYear Genre Quantity Description Price BookType BookPDFURL BookImageURL"
            ))
        : (books = await Books.find({ BookFrom: "writer" })
            .skip(skip)
            .limit(limit)
            .select(
              "Title Author PublishYear Genre Quantity Description Price BookType BookPDFURL BookImageURL"
            ));

      const totalBooks =
        searchType === "writer"
          ? await Books.countDocuments({ BookFrom: "writer" })
          : await Books.countDocuments();

      res.status(200).json({
        Status: "Successful",
        currentPage: page,
        totalPages: Math.ceil(totalBooks / limit),
        totalBooks,
        books,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ Status: "Failed", message: err.message });
    }
  },
];
