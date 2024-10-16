const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const { check, body, param, validationResult } = require("express-validator");
const Books = require("../Models/BookModel");
require("dotenv").config();

exports.AddBook = [
  body("Title")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Title is required")
    .matches(/^[a-zA-Z0-9\s:-]+$/)
    .withMessage("Invalid book title"),

  body("Author")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Author is required")
    .matches(/^[a-zA-Z0-9\s:\-.]+$/)
    .withMessage("Invalid author name"),

  body("PublishYear")
    .optional()
    .isInt({ min: 1450, max: new Date().getFullYear() })
    .withMessage("Publish Year must be a valid year"),

  body("Genre")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Genre is required and must be an array")
    .custom((genres) => {
      if (!genres.every((genre) => typeof genre === "string")) {
        throw new Error("Each genre must be a string");
      }
      return true;
    }),
  body("Description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description should not exceed 500 characters")
    .matches(/^[a-zA-Z0-9\s:,.-]+$/)
    .withMessage("Invalid description"),

  body("Copies")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Number of Copies must be a positive integer"),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  check("image")
    .optional()
    .custom((value, { req }) => {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/heic",
      ];
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new Error("Only JPG, PNG, WebP, and GIF images are allowed");
      }
      return true;
    })
    .custom((value, { req }) => {
      if (req.file.size > 6 * 1024 * 1024) {
        throw new Error("Image size should not exceed 10MB");
      }
      return true;
    }),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { Title, Author, PublishYear, Genre, Copies, Description, Price } =
      req.body;

    let bookImageURL;

    await cloudinary.uploader.upload_stream(
      {
        folder: "BookImages",
        width: 500,
        crop: "scale",
        quality: "60",
        format: "webp",
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          res
            .status(500)
            .json({ Status: "Failed", message: "Failed to upload image" });
        } else {
          bookImageURL = result.public_id;
          req.file.stream.pipe(result);
        }
      }
    );

    const newBook = new Books({
      Title,
      Author,
      PublishYear,
      Genre,
      NumberOfCopies: Copies,
      Description,
      Price,
      owner: req.user.userId,
      BookImageURL: bookImageURL,
    });

    try {
      const data = await newBook.save();
      res.status(201).json({ Status: "Successful", data });
    } catch (err) {
      console.error("Failed to Add Book: ", err);
      res.status(500).json({ Status: "Failed", message: "Failed to add book" });
    }
  },
];

exports.DeleteBook = [
  body("bookId")
    .trim()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid Book ID"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookId } = req.body;

    try {
      const book = await Books.findById(bookId).select("owner");
      const bookImageId = await Books.findById(bookId).select("BookImageURL");

      if (!book) {
        return res
          .status(404)
          .json({ Status: "Failed", message: "Book not found" });
      }

      if (book.owner.toString() !== req.user.userId) {
        return res
          .status(403)
          .json({ Status: "Failed", message: "Unauthorized to Delete" });
      }

      if (bookImageId) {
        await cloudinary.uploader.destroy(bookImageId.BookImageURL, (error) => {
          if (error) {
            res
              .status(500)
              .json({ Status: "Failed", message: "Failed to Delete Book" });
          }
        });
      }

      await Books.findByIdAndDelete(bookId);

      res.status(204).send();
    } catch (err) {
      console.error("Failed to Delete Book: ", err);
      res
        .status(500)
        .json({ Status: "Failed", message: "Failed to Delete Book" });
    }
  },
];

exports.SearchBook = [
  param("name")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Book name cannot be empty")
    .matches(/^[a-zA-Z0-9\s+]+$/)
    .withMessage("Invalid book name"),

  async (req, res) => {
    console.log("errors");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let name = req.params.name;
    name = name.replace("+", " ");

    try {
      const books = await Books.find({
        owner: req.user.userId,
        $or: [
          { Title: { $regex: name, $options: "i" } },
          { Author: { $regex: name, $options: "i" } },
        ],
      });

      if (!Books.length) {
        return res
          .status(404)
          .json({ Status: "Failed", message: "No books found" });
      }

      res.json({
        Status: "Successful",
        books,
      });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ Status: "Failed", message: "Failed to Find book" });
    }
  },
];

exports.EditBook = [
  param("id")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid Book ID"),

  body("Title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty")
    .matches(/^[a-zA-Z0-9\s:-]+$/)
    .withMessage("Invalid book title"),
  body("Author")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Author cannot be empty")
    .matches(/^[a-zA-Z0-9\s:\-.]+$/)
    .withMessage("Invalid author name"),
  body("PublishYear")
    .optional()
    .isInt({ min: 1450, max: new Date().getFullYear() })
    .withMessage("Publish Year must be a valid year"),
  body("Genre")
    .optional()
    .isArray()
    .withMessage("Genre must be an array of strings")
    .custom((genres) => {
      if (!genres.every((genre) => typeof genre === "string")) {
        throw new Error("Each genre must be a string");
      }
      return true;
    }),
  body("NumberOfCopies")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Number of Copies must be a positive integer"),
  body("Description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description should not exceed 500 characters"),
  body("Price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  check("image")
    .optional()
    .custom((value, { req }) => {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/heic",
      ];
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new Error("Only JPG, PNG, WebP, and GIF images are allowed");
      }
      return true;
    })
    .custom((value, { req }) => {
      if (req.file.size > 6 * 1024 * 1024) {
        throw new Error("Image size should not exceed 10MB");
      }
      return true;
    }),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const bookId = req.params.id;
      const updateData = req.body;

      const bookOwner = await Books.findById(bookId).select("owner");
      const bookImageId = await Books.findById(bookId).select("BookImageURL");

      if (!bookOwner) {
        return res
          .status(404)
          .json({ Status: "Failed", message: "Book not found" });
      }

      if (bookOwner.owner.toString() !== req.user.userId) {
        return res
          .status(403)
          .json({ Status: "Failed", message: "Unauthorized to edit" });
      }

      if (bookImageId) {
        await cloudinary.uploader.destroy(bookImageId.BookImageURL, (error) => {
          if (error) {
            res.status(500).json({
              Status: "Failed",
              message: "Failed to delete previous book image",
            });
          }
        });

        cloudinary.uploader.upload_stream(
          {
            public_id: bookImageId.BookImageURL,
            folder: "BookImages",
            width: 500,
            crop: "scale",
            quality: "60",
            format: "webp",
            unique_filename: true,
          },
          (error, result) => {
            if (error) {
              res.status(500).json({
                Status: "Failed",
                message: "Failed to update book image",
              });
            } else {
              req.file.stream.pipe(result);
            }
          }
        );
      }

      const updatedBook = await Books.findByIdAndUpdate(
        bookId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      res.json(updatedBook);
    } catch (error) {
      res.status(500).json({ message: "Failed to update book" });
    }
  },
];
