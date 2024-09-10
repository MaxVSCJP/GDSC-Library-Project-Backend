const mongoose = require("mongoose");
const { param, validationResult } = require('express-validator');
const Books = require("../Models/BookModel");


exports.SearchBook = [
    param('name')
        .trim()
        .isLength({ min: 1 }).withMessage('Book name cannot be empty')
        .matches(/^[a-zA-Z0-9\s+]+$/).withMessage('Invalid book name'),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const name = req.params.name;

        try {
            const books = await Books.find({
                $or: [
                    { Title: { $regex: name, $options: "i" } },
                    { Author: { $regex: name, $options: "i" } }
                ]
            });

            if (!Books.length) {
                return res.status(404).json({ Status: "Failed", message: "No books found" });
            }

            res.json({
                Status: "Successful",
                books
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ Status: "Failed", message: err.message });
        }
    }
];