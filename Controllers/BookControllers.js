const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const { check, body, param, validationResult } = require("express-validator");
const Books = require("../Models/BookModel");
const User = require("../Models/UserModel");
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
    .custom((value) => {
      if (typeof value === "string") {
        value = JSON.parse(value);
      }
      if (!Array.isArray(value)) {
        throw new Error("Genre must be an array of strings");
      }
      if (!value.every((genre) => typeof genre === "string")) {
        throw new Error("Each genre must be a string");
      }
      return true;
    }),
  body("Description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description should not exceed 2000 characters")
    .matches(/^[a-zA-Z0-9\s:,.\-']+$/)
    .withMessage("Invalid description"),

  body("Quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Number of Quantity must be a positive integer"),

  body("Price")
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
      if (!allowedTypes.includes(req.files.image[0].mimetype)) {
        throw new Error("Only JPG, PNG, WebP, and GIF images are allowed");
      }
      return true;
    })
    .custom((value, { req }) => {
      if (req.files.image[0].size > 4 * 1024 * 1024) {
        throw new Error("Image size should not exceed 4MB");
      }
      return true;
    }),

  check("BookPDF")
    .optional()
    .custom((value, { req }) => {
      const allowedTypes = [
        "application/pdf",
        "application/x-pdf",
        "application/epub+zip",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(req.files.BookPDF[0].mimetype)) {
        throw new Error("Only PDF, EPUB, and DOC files are allowed");
      }
      return true;
    })
    .custom((value, { req }) => {
      if (req.files.BookPDF[0].size > 10 * 1024 * 1024) {
        throw new Error("File size should not exceed 10MB");
      }
      return true;
    }),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.body.Genre) {
      req.body.Genre = JSON.parse(req.body.Genre).map((g) => g.trim());
    }

    const { Title, Author, PublishYear, Genre, Quantity, Description, Price } =
      req.body;

    let bookImage;
    if (req.files.image) {
      const uploadFromBuffer = (buffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "BookImages",
              width: 500,
              crop: "scale",
              quality: "60",
              format: "webp",
              unique_filename: true,
            },
            (error, bookImage) => {
              if (bookImage) {
                resolve(bookImage);
              } else {
                reject(error);
              }
            }
          );
          stream.end(buffer);
        });
      };

      bookImage = await uploadFromBuffer(req.files.image[0].buffer);
    }

    let bookPDF;
    if (req.files.BookPDF) {
      const uploadFromBuffer = (buffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "BookPDF",
              unique_filename: true,
            },
            (error, bookPDF) => {
              if (bookPDF) {
                resolve(bookPDF);
              } else {
                reject(error);
              }
            }
          );
          stream.end(buffer);
        });
      };

      bookPDF = await uploadFromBuffer(req.files.BookPDF[0].buffer);
    }

    const newBook = new Books({
      Title,
      Author,
      PublishYear,
      Genre,
      Quantity,
      Description,
      Price,
      BookType: req.files.BookPDF ? "digital" : "physical",
      BookFrom: req.body.role,
      owner: req.user.userId,
      BookImageURL: bookImage ? bookImage.secure_url : null,
      BookImageID: bookImage ? bookImage.public_id : null,
      BookPDFURL: bookPDF ? bookPDF.secure_url : null,
      BookPDFID: bookPDF ? bookPDF.public_id : null,
    });

    try {
      const data = await newBook.save();

      await User.findByIdAndUpdate(req.user.userId, {
        $push: { books: data._id },
      });
      res.status(201).json({ Status: "Successful", data });
    } catch (err) {
      console.error("Failed to Add Book: ", err);
      res.status(500).json({ Status: "Failed", message: "Failed to add Book" });
    }
  },
];

exports.DeleteBook = [
  param("bookId")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid Book ID"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const bookId = req.params.bookId;

    try {
      const book = await Books.findById(bookId).select("owner BookImageID");

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

      if (book.BookImageID) {
        await cloudinary.uploader.destroy(book.BookImageID, (error) => {
          if (error) {
            res.status(500).json({
              Status: "Failed",
              message: "Failed to Delete Book",
            });
          }
        });
      }

      await User.findByIdAndUpdate(req.user.userId, {
        $pull: { books: bookId },
      });

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
          { Title: { $regex: `.*${name}.*`, $options: "i" } },
          { Genre: { $regex: `.*${name}.*`, $options: "i" } },
          { Author: { $regex: `.*${name}.*`, $options: "i" } },
        ],
      }).select(
        "Title Author PublishYear Genre Quantity Description Price BookType BookPDFURL BookImageURL"
      );

      if (!books.length) {
        return res
          .status(404)
          .json({ Status: "Failed", message: "No Books found" });
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

  body("Title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Book needs a name")
    .matches(/^[a-zA-Z0-9\s:-]+$/)
    .withMessage("Invalid book name"),

  body("Genre")
    .optional()
    .custom((value) => {
      if (typeof value === "string") {
        value = JSON.parse(value);
      }
      if (!Array.isArray(value)) {
        throw new Error("Genre must be an array of strings");
      }
      if (!value.every((genre) => typeof genre === "string")) {
        throw new Error("Each genre must be a string");
      }
      return true;
    }),

  body("Quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),

  body("Description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description should not exceed 2000 characters"),

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
      if (!allowedTypes.includes(req.files.image[0].mimetype)) {
        throw new Error("Only JPG, PNG, WebP, and GIF images are allowed");
      }
      return true;
    })
    .custom((value, { req }) => {
      if (req.files.image[0].size > 4 * 1024 * 1024) {
        throw new Error("Image size should not exceed 4MB");
      }
      return true;
    }),

  check("BookPDF")
    .optional()
    .custom((value, { req }) => {
      const allowedTypes = [
        "application/pdf",
        "application/x-pdf",
        "application/epub+zip",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(req.files.BookPDF[0].mimetype)) {
        throw new Error("Only PDF, EPUB, and DOC files are allowed");
      }
      return true;
    })
    .custom((value, { req }) => {
      if (req.files.BookPDF[0].size > 10 * 1024 * 1024) {
        throw new Error("File size should not exceed 10MB");
      }
      return true;
    }),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      if (req.body.Genre) {
        req.body.Genre = JSON.parse(req.body.Genre).map((g) => g.trim());
      }
      const bookId = req.params.id;
      const updateData = req.body;

      const book = await Books.findById(bookId).select("owner BookImageID");

      if (!book) {
        return res
          .status(404)
          .json({ Status: "Failed", message: "Book not found" });
      }

      if (book.owner.toString() !== req.user.userId) {
        return res
          .status(403)
          .json({ Status: "Failed", message: "Unauthorized to edit" });
      }

      let bookImage;
      if (req.files.image) {
        await cloudinary.uploader.destroy(book.BookImageID, (error) => {
          if (error) {
            res.status(500).json({
              Status: "Failed",
              message: "Failed to delete previous book image",
            });
          }
        });

        const uploadFromBuffer = (buffer) => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                public_id: book.BookImageID.replace("BookImages/", ""),
                folder: "BookImages",
                width: 500,
                crop: "scale",
                quality: "60",
                format: "webp",
              },
              (error, bookImage) => {
                if (bookImage) {
                  resolve(bookImage);
                } else {
                  reject(error);
                }
              }
            );
            stream.end(buffer);
          });
        };

        bookImage = await uploadFromBuffer(req.files.image[0].buffer);

        updateData.BookImageURL = bookImage.secure_url;
      }

      let bookPDF;
      if (req.files.BookPDF) {
        await cloudinary.uploader.destroy(book.BookPDFID, (error) => {
          if (error) {
            res.status(500).json({
              Status: "Failed",
              message: "Failed to delete previous book PDF",
            });
          }
        });

        const uploadFromBuffer = (buffer) => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                public_id: book.BookPDFID.replace("BookPDF/", ""),
                folder: "BookPDF",
              },
              (error, bookPDF) => {
                if (bookPDF) {
                  resolve(bookPDF);
                } else {
                  reject(error);
                }
              }
            );
            stream.end(buffer);
          });
        };

        bookPDF = await uploadFromBuffer(req.files.BookPDF[0].buffer);

        updateData.BookPDFURL = bookPDF.secure_url;
      }

      const updatedBook = await Books.findByIdAndUpdate(
        bookId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      res.json(updatedBook);
    } catch (error) {
      res.status(500).json({ message: "Failed to update book" });
      console.log(error);
    }
  },
];
